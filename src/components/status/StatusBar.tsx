import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { getActiveStatuses, createStatus, uploadImage, deleteExpiredStatuses, supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import type { Status } from '@/types';

interface StatusBarProps {
    userId: string;
    userAvatar?: string | null;
    userDisplayName?: string | null;
    onViewStatus: (statuses: Status[], startIndex: number) => void;
}

export function StatusBar({ userId, userAvatar, userDisplayName, onViewStatus }: StatusBarProps) {
    const [allStatuses, setAllStatuses] = useState<Status[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const init = async () => {
            if (userId) await deleteExpiredStatuses(userId);
            await loadStatuses();
        };
        init();

        const channel = supabase
            .channel('public:statuses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses' }, () => {
                loadStatuses();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const loadStatuses = async () => {
        const { data } = await getActiveStatuses();
        if (data) setAllStatuses(data as unknown as Status[]);
    };

    // Group statuses by user
    const groupedByUser = allStatuses.reduce<Record<string, Status[]>>((acc, s) => {
        if (!acc[s.user_id]) acc[s.user_id] = [];
        acc[s.user_id].push(s);
        return acc;
    }, {});

    const myStatuses = groupedByUser[userId] || [];
    const othersStatuses = Object.entries(groupedByUser)
        .filter(([uid]) => uid !== userId)
        .map(([, statuses]) => statuses);

    const handleAddStatus = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            console.log('Uploading status image:', file.name, file.size);
            const url = await uploadImage(file, userId);
            console.log('Upload result URL:', url);
            if (url) {
                const { error } = await createStatus(userId, '', url, 'image');
                if (error) {
                    console.error('Create status error:', error);
                    showToast('Gagal menyimpan status: ' + error.message, 'error');
                } else {
                    showToast('Status berhasil ditambahkan! ✨', 'success');
                    await loadStatuses();
                }
            } else {
                showToast('Gagal upload foto. Cek RLS policy Storage di Supabase.', 'error');
            }
        } catch (err: any) {
            console.error('Status upload failed:', err);
            showToast('Error: ' + (err?.message || 'Upload gagal'), 'error');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const getInitials = (email: string) => (email || '??').substring(0, 2).toUpperCase();

    return (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                {/* My Status */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 group">
                    <div className="relative">
                        <button
                            onClick={() => myStatuses.length > 0 && onViewStatus(myStatuses, 0)}
                            className={`w-14 h-14 rounded-full p-0.5 ${myStatuses.length > 0 ? 'bg-gradient-to-br from-pink-500 to-rose-500' : 'bg-gray-200 dark:bg-gray-700'} hover:scale-105 transition-transform`}
                        >
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={userAvatar || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-400 text-white text-sm font-bold">
                                        {getInitials(userDisplayName || '??')}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </button>
                        <label className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 cursor-pointer hover:scale-110 transition-transform">
                            {isUploading ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Plus className="w-3.5 h-3.5 text-white" />
                            )}
                            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleAddStatus} disabled={isUploading} />
                        </label>
                    </div>
                    <span className="text-[10px] text-center font-semibold text-gray-600 dark:text-gray-400 truncate w-14">
                        Status Saya
                    </span>
                </div>

                {/* Others' Statuses */}
                {othersStatuses.map((statuses) => {
                    const first = statuses[0];
                    const profile = first.profile;
                    const name = profile?.display_name || profile?.email || '?';
                    return (
                        <button
                            key={first.user_id}
                            onClick={() => onViewStatus(statuses, 0)}
                            className="flex flex-col items-center gap-1.5 shrink-0 group"
                        >
                            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 group-hover:scale-105 transition-transform">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={profile?.avatar_url || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm font-bold">
                                            {getInitials(profile?.email || '?')}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 truncate w-14 text-center">
                                {name.split('@')[0].substring(0, 8)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
