import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useNotifications(userId: string | null) {
    const swRegistration = useRef<ServiceWorkerRegistration | null>(null);
    const permissionGranted = useRef(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !userId) return;

        // Register service worker
        navigator.serviceWorker.register('/sw.js').then((reg) => {
            swRegistration.current = reg;
            console.log('[Notifications] Service Worker registered');
        }).catch((err) => {
            console.warn('[Notifications] SW registration failed:', err);
        });

        // Request notification permission
        if (Notification.permission === 'granted') {
            permissionGranted.current = true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
                permissionGranted.current = permission === 'granted';
            });
        }
    }, [userId]);

    /**
     * Show a browser notification for an incoming message.
     * Called when a new message arrives via Supabase realtime.
     */
    const showMessageNotification = useCallback((
        senderName: string,
        messageText: string,
        chatId: string,
        avatarUrl?: string
    ) => {
        if (!permissionGranted.current) return;
        // Don't notify if window is focused
        if (document.visibilityState === 'visible') return;

        const title = `💕 ${senderName}`;
        const body = messageText.length > 80 ? messageText.substring(0, 80) + '...' : messageText;

        if (swRegistration.current) {
            swRegistration.current.showNotification(title, {
                body,
                icon: avatarUrl || '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                tag: `msg-${chatId}`,
                renotify: true,
                data: { chatId },
            } as NotificationOptions);
        } else {
            // Fallback to simple Notification API
            new Notification(title, { body, icon: avatarUrl || '/icon-192.png' });
        }
    }, []);

    return { showMessageNotification };
}

/**
 * Subscribe to new messages across ALL chats for this user
 * and show desktop notifications.
 */
export function useGlobalMessageNotifications(
    userId: string | null,
    currentChatId?: string | null
) {
    const { showMessageNotification } = useNotifications(userId);

    useEffect(() => {
        if (!userId) return;

        // Listen to all messages where this user is NOT the sender
        const channel = supabase
            .channel(`global_notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                async (payload) => {
                    const msg = payload.new as any;
                    // Skip our own messages
                    if (msg.sender_id === userId) return;
                    // Skip if we're already in this chat room (messages shown inline)
                    if (msg.chat_id === currentChatId && document.visibilityState === 'visible') return;

                    // Get sender profile
                    try {
                        const { data: profile } = await (supabase as any)
                            .from('profiles')
                            .select('display_name, avatar_url, email')
                            .eq('id', msg.sender_id)
                            .single();

                        const p = profile as any;
                        const senderName = p?.display_name || p?.email?.split('@')[0] || 'Seseorang';
                        const avatarUrl = p?.avatar_url;

                        // Determine message preview text
                        let preview = '📨 Pesan baru';
                        if (msg.type === 'image') preview = '📷 Mengirim foto';
                        else if (msg.type === 'video') preview = '📹 Mengirim video';
                        else if (msg.type === 'voice') preview = '🎤 Pesan suara';
                        else if (msg.type === 'poll') preview = '📊 Membuat polling';
                        else if (msg.type === 'location') preview = '📍 Berbagi lokasi';
                        else if (msg.iv === 'plain' && msg.ciphertext) {
                            // Plain text — decode fallback
                            try { preview = decodeURIComponent(escape(atob(msg.ciphertext))); } catch { /* noop */ }
                        } else {
                            preview = '🔒 Pesan terenkripsi';
                        }

                        showMessageNotification(senderName, preview, msg.chat_id, avatarUrl);
                    } catch (e) {
                        // Still show notification even if profile fetch fails
                        showMessageNotification('Seseorang', '📨 Pesan baru', msg.chat_id);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId, currentChatId, showMessageNotification]);
}
