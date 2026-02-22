import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeMessages(
  chatId: string | null,
  onMessage: (message: any) => void,
  onUpdate?: (message: any) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!chatId) return;

    // Create channel for this chat
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            onMessage(payload.new);
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload.new);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [chatId, onMessage]);
}

export function useRealtimeCalls(
  chatId: string | null,
  onCallUpdate: (call: any) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`calls:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          onCallUpdate(payload.new);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [chatId, onCallUpdate]);
}

export function useTypingIndicator(
  chatId: string | null,
  userId: string | null,
  onTyping: (userId: string, isTyping: boolean) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId || !userId) return;

    const channel = supabase
      .channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.userId !== userId) {
          onTyping(payload.userId, payload.isTyping);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [chatId, userId, onTyping]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!channelRef.current || !userId) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping },
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, isTyping: false },
          });
        }, 3000);
      }
    },
    [userId]
  );

  return { sendTyping };
}

export function useOnlineStatus(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    // Update online status
    const updateOnlineStatus = async (online: boolean) => {
      await supabase
        .from('profiles')
        .update({ online, last_seen: new Date().toISOString() })
        .eq('id', userId);
    };

    // Set online when component mounts
    updateOnlineStatus(true);

    // Set offline when window closes
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    // Heartbeat to keep online status
    const heartbeat = setInterval(() => {
      updateOnlineStatus(true);
    }, 30000);

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [userId]);
}

export function useRealtimeProfile(
  userId: string | null,
  onProfileUpdate: (profile: any) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          onProfileUpdate(payload.new);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, onProfileUpdate]);
}
