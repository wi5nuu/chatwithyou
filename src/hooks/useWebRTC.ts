import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Call } from '@/types';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface UseWebRTCProps {
  chatId: string;
  userId: string;
  callType: 'voice' | 'video';
  onCallEnd?: () => void;
}

export function useWebRTC({ chatId, userId, callType, onCallEnd }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callChannelRef = useRef<any>(null);

  const iceCandidateChannelRef = useRef<any>(null);

  // ─── End call (defined first since other callbacks depend on it) ───────────
  const endCall = useCallback(async () => {
    if (currentCall) {
      await supabase
        .from('calls')
        .update({ status: 'ended' })
        .eq('id', currentCall.id);
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (callChannelRef.current) {
      supabase.removeChannel(callChannelRef.current);
    }

    if (iceCandidateChannelRef.current) {
      supabase.removeChannel(iceCandidateChannelRef.current);
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsRinging(false);
    setCurrentCall(null);
    peerConnectionRef.current = null;
    callChannelRef.current = null;
    iceCandidateChannelRef.current = null;

    onCallEnd?.();
  }, [currentCall, localStream, onCallEnd]);

  // ─── ICE Candidate helpers ──────────────────────────────────────────────────
  const subscribeToIceCandidates = useCallback((callId: string, pc: RTCPeerConnection) => {
    const channel = supabase
      .channel(`call_candidates:${callId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_candidates',
        filter: `call_id=eq.${callId}`,
      }, (payload) => {
        const candidate = payload.new as any;
        if (candidate.user_id !== userId && candidate.candidate) {
          try {
            pc.addIceCandidate(new RTCIceCandidate(candidate.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      })
      .subscribe();
    iceCandidateChannelRef.current = channel;
  }, [userId]);

  const sendIceCandidate = useCallback(async (callId: string, candidate: RTCIceCandidateInit) => {
    await supabase
      .from('call_candidates')
      .insert({
        call_id: callId,
        user_id: userId,
        candidate: candidate as any,
      });
  }, [userId]);

  // ─── Peer connection ────────────────────────────────────────────────────────
  const createPeerConnection = useCallback((callId?: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = async (event) => {
      if (event.candidate && callId) {
        await sendIceCandidate(callId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  }, [sendIceCandidate, endCall]);

  // ─── Start a call ────────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    try {
      setCallError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      setLocalStream(stream);
      setIsRinging(true);

      const offer = await new RTCPeerConnection(ICE_SERVERS).createOffer();
      const { data: callData, error } = await supabase
        .from('calls')
        .insert({
          chat_id: chatId,
          caller_id: userId,
          type: callType,
          offer: offer as any,
          status: 'ringing',
        })
        .select()
        .single();

      if (error) throw error;

      const newCall: Call = {
        id: callData.id,
        chat_id: callData.chat_id,
        caller_id: callData.caller_id,
        offer: callData.offer,
        answer: callData.answer,
        status: callData.status as any,
        type: callData.type as any,
        created_at: callData.created_at,
      };

      setCurrentCall(newCall);

      const pc = createPeerConnection(callData.id);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const actualOffer = await pc.createOffer();
      await pc.setLocalDescription(actualOffer);

      await supabase
        .from('calls')
        .update({ offer: actualOffer as any })
        .eq('id', callData.id);

      subscribeToIceCandidates(callData.id, pc);

      const channel = supabase
        .channel(`call:${callData.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${callData.id}`,
        }, async (payload) => {
          const updatedCall = payload.new as Call;

          if (updatedCall.status === 'connected' && updatedCall.answer) {
            setIsRinging(false);
            setIsCallActive(true);
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(updatedCall.answer));
            } catch (e) {
              console.error('Error setting remote description:', e);
            }
          } else if (updatedCall.status === 'ended' || updatedCall.status === 'declined') {
            endCall();
          }
        })
        .subscribe();

      callChannelRef.current = channel;

    } catch (error: any) {
      console.error('Error starting call:', error);
      setCallError(error.message);
      endCall();
    }
  }, [chatId, userId, callType, createPeerConnection, subscribeToIceCandidates, endCall]);

  // ─── Answer a call ────────────────────────────────────────────────────────────
  const answerCall = useCallback(async (call: Call) => {
    try {
      setCallError(null);
      setCurrentCall(call);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.type === 'video',
      });

      setLocalStream(stream);

      const pc = createPeerConnection(call.id);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      if (call.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await supabase
        .from('calls')
        .update({
          answer: answer as any,
          status: 'connected',
        })
        .eq('id', call.id);

      setIsCallActive(true);

      subscribeToIceCandidates(call.id, pc);

      supabase
        .channel(`call:${call.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${call.id}`,
        }, async (payload) => {
          const updatedCall = payload.new as Call;
          if (updatedCall.status === 'ended') {
            endCall();
          }
        })
        .subscribe();

    } catch (error: any) {
      console.error('Error answering call:', error);
      setCallError(error.message);
      endCall();
    }
  }, [createPeerConnection, subscribeToIceCandidates, endCall]);

  // ─── Decline a call ───────────────────────────────────────────────────────────
  const declineCall = useCallback(async (callId: string) => {
    try {
      await supabase
        .from('calls')
        .update({ status: 'declined' })
        .eq('id', callId);
      endCall();
    } catch (error) {
      console.error('Error declining call:', error);
    }
  }, [endCall]);

  // Listen for incoming calls
  useEffect(() => {
    if (!chatId || !userId) return;

    const channel = supabase
      .channel(`incoming-calls:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newCall = payload.new as Call;
          
          // Only notify if we're not the caller
          if (newCall.caller_id !== userId && newCall.status === 'ringing') {
            setCurrentCall(newCall);
            setIsRinging(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    isCallActive,
    isRinging,
    callError,
    currentCall,
    startCall,
    answerCall,
    declineCall,
    endCall,
  };
}
