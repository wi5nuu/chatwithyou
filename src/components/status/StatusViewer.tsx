import { useState, useEffect } from 'react';
import { X, ChevronRight, Trash2, Eye } from 'lucide-react';
import { trackStatusView, getStatusViews } from '@/lib/supabase';
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
    const [viewers, setViewers] = useState<any[]>([]);
    const [showViewers, setShowViewers] = useState(false);

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

        // Track view
        if (userId && status?.id) {
            trackStatusView(status.id, userId);
        }

        // Fetch viewers if owner
        if (userId === status?.user_id) {
            getStatusViews(status.id).then(({ data }: { data: any }) => {
                if (data) setViewers(data);
            });
        }

        return () => clearInterval(interval);
    }, [current, statuses.length, userId, status?.id, status?.user_id]);

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
                <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
                    {status.media_type === 'image' && status.media_url ? (
                        <img
                            src={status.media_url}
                            alt="Status"
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : status.media_type === 'video' && status.media_url ? (
                        <video
                            src={status.media_url}
                            className="max-h-full max-w-full object-contain"
                            autoPlay
                            muted
                            playsInline
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-pink-900 to-purple-900">
                            <p className="text-white text-2xl font-bold text-center px-8 leading-relaxed">{status.content}</p>
                        </div>
                    )}
                </div>

                {/* Viewers Toggle */}
                {userId === status.user_id && (
                    <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowViewers(!showViewers);
                            }}
                            className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
                        >
                            <ChevronRight className={`w-5 h-5 transition-transform ${showViewers ? 'rotate-90' : '-rotate-90'}`} />
                            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-bold">{viewers.length} Tayangan</span>
                            </div>
                        </button>

                        {showViewers && (
                            <div className="mt-4 w-full max-h-48 overflow-y-auto bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 animate-in slide-in-from-bottom duration-300">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Dilihat Oleh</p>
                                <div className="space-y-3">
                                    {viewers.length > 0 ? viewers.map((v, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-xs font-bold text-white">
                                                {v.profile?.avatar_url ? (
                                                    <img src={v.profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    (v.profile?.display_name || v.profile?.email || '?')[0].toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white text-xs font-bold">{v.profile?.display_name || v.profile?.email?.split('@')[0]}</p>
                                                <p className="text-white/40 text-[10px]">{new Date(v.created_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-white/40 text-xs italic text-center py-4">Belum ada tayangan</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
