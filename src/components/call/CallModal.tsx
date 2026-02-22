import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

interface CallModalProps {
  chatId: string;
  userId: string;
  otherUser: Profile | null;
  callType: 'voice' | 'video';
  isIncoming?: boolean;
  incomingCall?: any;
  onClose: () => void;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function CallModal({ 
  chatId, 
  userId, 
  otherUser, 
  callType, 
  isIncoming = false, 
  incomingCall,
  onClose 
}: CallModalProps) {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentCall, setCurrentCall] = useState<any>(incomingCall);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeCall = async () => {
    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      setLocalStream(stream);

      if (isIncoming && incomingCall) {
        // Incoming call - wait for user to answer
        setCurrentCall(incomingCall);
        
        // Subscribe to call updates
        subscribeToCallUpdates(incomingCall.id);
      } else {
        // Outgoing call - create call in database
        await startOutgoingCall(stream);
      }
    } catch (error) {
      console.error('Error initializing call:', error);
      onClose();
    }
  };

  const startOutgoingCall = async (stream: MediaStream) => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

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
      
      setCurrentCall(callData);
      subscribeToCallUpdates(callData.id);

    } catch (error) {
      console.error('Error starting outgoing call:', error);
      onClose();
    }
  };

  const subscribeToCallUpdates = (callId: string) => {
    supabase
      .channel(`call:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${callId}`,
        },
        async (payload) => {
          const updatedCall = payload.new;
          
          if (updatedCall.status === 'connected' && updatedCall.answer) {
            // Call answered
            setCallStatus('connected');
            
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(updatedCall.answer)
              );
            }
            
            startDurationTimer();
          } else if (updatedCall.status === 'ended' || updatedCall.status === 'declined') {
            // Call ended
            endCall();
          }
        }
      )
      .subscribe();
  };

  const answerCall = async () => {
    try {
      if (!currentCall || !localStream) return;

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Set remote description (offer)
      if (currentCall.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(currentCall.offer));
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
        .eq('id', currentCall.id);

      setCallStatus('connected');
      startDurationTimer();

    } catch (error) {
      console.error('Error answering call:', error);
      endCall();
    }
  };

  const declineCall = async () => {
    if (currentCall) {
      await supabase
        .from('calls')
        .update({ status: 'declined' })
        .eq('id', currentCall.id);
    }
    onClose();
  };

  const endCall = async () => {
    if (currentCall) {
      await supabase
        .from('calls')
        .update({ status: 'ended' })
        .eq('id', currentCall.id);
    }
    
    cleanup();
    onClose();
  };

  const cleanup = () => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Incoming call screen
  if (isIncoming && callStatus === 'ringing') {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <Avatar className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500">
            <AvatarFallback className="text-white text-2xl">
              {getInitials(otherUser?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-white mb-2">{otherUser?.email}</h2>
          <p className="text-gray-400">
            {callType === 'video' ? 'Video Call...' : 'Voice Call...'}
          </p>
        </div>

        <div className="flex gap-8">
          <Button
            variant="destructive"
            size="lg"
            className="w-16 h-16 rounded-full"
            onClick={declineCall}
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
          <Button
            variant="default"
            size="lg"
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
            onClick={answerCall}
          >
            <Phone className="w-8 h-8" />
          </Button>
        </div>
      </div>
    );
  }

  // Active call screen
  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500">
            <AvatarFallback className="text-white text-sm">
              {getInitials(otherUser?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-white">{otherUser?.email}</p>
            <p className="text-sm text-gray-400">
              {callStatus === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white" onClick={endCall}>
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>

      {/* Video/Avatar Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {callType === 'video' ? (
          <>
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-32 h-48 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </>
        ) : (
          <div className="text-center">
            <Avatar className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500">
              <AvatarFallback className="text-white text-4xl">
                {getInitials(otherUser?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            <p className="text-white text-xl">{otherUser?.email}</p>
            <p className="text-gray-400 mt-2">{formatDuration(callDuration)}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 flex items-center justify-center gap-6">
        <Button
          variant="secondary"
          size="lg"
          className={`w-14 h-14 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : ''}`}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>
        
        {callType === 'video' && (
          <Button
            variant="secondary"
            size="lg"
            className={`w-14 h-14 rounded-full ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : ''}`}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
        )}
        
        <Button
          variant="destructive"
          size="lg"
          className="w-14 h-14 rounded-full"
          onClick={endCall}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
