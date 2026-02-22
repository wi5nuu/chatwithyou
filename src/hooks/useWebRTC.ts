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

  // Initialize peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    pc.onicecandidate = async (event) => {
      if (event.candidate && currentCall) {
        // Send ICE candidate through signaling
        // In a full implementation, we'd have a separate table for ICE candidates
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
  }, [currentCall]);

  // Start a call
  const startCall = useCallback(async () => {
    try {
      setCallError(null);
      
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      
      setLocalStream(stream);
      setIsRinging(true);

      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Create call in database
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

      // Subscribe to call updates
      const channel = supabase
        .channel(`call:${callData.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'calls',
            filter: `id=eq.${callData.id}`,
          },
          async (payload) => {
            const updatedCall = payload.new as Call;
            
            if (updatedCall.status === 'connected' && updatedCall.answer) {
              // Call answered
              setIsRinging(false);
              setIsCallActive(true);
              
              // Set remote description
              await pc.setRemoteDescription(new RTCSessionDescription(updatedCall.answer));
            } else if (updatedCall.status === 'ended' || updatedCall.status === 'declined') {
              // Call ended
              endCall();
            }
          }
        )
        .subscribe();

      callChannelRef.current = channel;

    } catch (error: any) {
      console.error('Error starting call:', error);
      setCallError(error.message);
      endCall();
    }
  }, [chatId, userId, callType, createPeerConnection]);

  // Answer a call
  const answerCall = useCallback(async (call: Call) => {
    try {
      setCallError(null);
      setCurrentCall(call);

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.type === 'video',
      });
      
      setLocalStream(stream);

      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Set remote description (offer)
      if (call.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
      }

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Update call with answer
      await supabase
        .from('calls')
        .update({
          answer: answer as any,
          status: 'connected',
        })
        .eq('id', call.id);

      setIsCallActive(true);

      // Subscribe to call updates
      supabase
        .channel(`call:${call.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'calls',
            filter: `id=eq.${call.id}`,
          },
          async (payload) => {
            const updatedCall = payload.new as Call;
            
            if (updatedCall.status === 'ended') {
              endCall();
            }
          }
        )
        .subscribe();

    } catch (error: any) {
      console.error('Error answering call:', error);
      setCallError(error.message);
      endCall();
    }
  }, [createPeerConnection]);

  // Decline a call
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
  }, []);

  // End call
  const endCall = useCallback(async () => {
    // Update call status
    if (currentCall) {
      await supabase
        .from('calls')
        .update({ status: 'ended' })
        .eq('id', currentCall.id);
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Unsubscribe from call channel
    if (callChannelRef.current) {
      supabase.removeChannel(callChannelRef.current);
    }

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsRinging(false);
    setCurrentCall(null);
    peerConnectionRef.current = null;
    callChannelRef.current = null;

    onCallEnd?.();
  }, [currentCall, localStream, onCallEnd]);

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
