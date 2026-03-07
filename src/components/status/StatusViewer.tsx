import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { Status } from '@/types';

interface StatusViewerProps {
    statuses: Status[];
    startIndex?: number;
    userId?: string;
    onClose: () => void;
    onDelete?: (statusId: string) => void;
}

export function StatusViewer({ statuses, startIndex = 0, userId, onClose, onDelete }: StatusViewerProps) {
    const [current, setCurrent] = useState(startIndex);
    const [progress, setProgress] = useState(0);

    const status = statuses[current];
    const DURATION = 5000;

    useEffect(() => {
        setProgress(0);
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.min((elapsed / DURATION) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                clearInterval(interval);
                if (current < statuses.length - 1) {
                    setCurrent(c => c + 1);
                } else {
                    onClose();
                }
            }
        }, 50);
        return () => clearInterval(interval);
    }, [current, statuses.length]);

    if (!status) return null;

    const profile = status.profile;
    const getInitials = (email: string) => (email || '??').substring(0, 2).toUpperCase();
    const displayName = profile?.display_name || profile?.email || '?';

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
            <div className="relative w-full max-w-sm h-full max-h-[100vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
                    {statuses.map((_, i) => (
                        <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-none rounded-full"
                                style={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-6 left-0 right-0 z-10 flex items-center gap-3 px-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {getInitials(profile?.email || '?')}
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm">{displayName.split('@')[0]}</p>
                        <p className="text-white/60 text-xs">{formatTime(status.created_at)}</p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-white p-1 hover:bg-white/20 rounded-full transition-colors mr-2">
                        <X className="w-5 h-5" />
                    </button>
                    {userId === status.user_id && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onDelete) onDelete(status.id);
                            }}
                            className="text-white p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center">
                    {status.media_type === 'image' && status.media_url ? (
                        <img
                            src={status.media_url}
                            alt="Status"
                            className="w-full h-full object-cover"
                        />
                    ) : status.media_type === 'video' && status.media_url ? (
                        <video
                            src={status.media_url}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-pink-900 to-purple-900">
                            <p className="text-white text-2xl font-bold text-center px-8 leading-relaxed">{status.content}</p>
                        </div>
                    )}
                </div>

                {/* Navigation overlay */}
                {current > 0 && (
                    <button
                        onClick={() => setCurrent(c => c - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 rounded-full text-white hover:bg-black/50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
                {current < statuses.length - 1 && (
                    <button
                        onClick={() => setCurrent(c => c + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/30 rounded-full text-white hover:bg-black/50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
