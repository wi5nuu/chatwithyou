import { useEffect } from 'react';

export function useTabNotification(unreadCount: number) {
    useEffect(() => {
        const originalTitle = 'LoveChat';
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) ${originalTitle} 💕`;
        } else {
            document.title = originalTitle;
        }

        return () => {
            document.title = originalTitle;
        };
    }, [unreadCount]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const originalTitle = 'LoveChat';
                if (unreadCount > 0) {
                    document.title = `(${unreadCount}) ${originalTitle} 💕`;
                } else {
                    document.title = originalTitle;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [unreadCount]);
}
