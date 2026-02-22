import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search, Users, Camera, Check } from 'lucide-react';
import { searchProfiles, createGroupChat, uploadAvatar } from '@/lib/supabase';
import type { Profile } from '@/types';

interface CreateGroupModalProps {
    userId: string;
    onClose: () => void;
    onCreated: () => void;
}

export function CreateGroupModal({ userId, onClose, onCreated }: CreateGroupModalProps) {
    const [step, setStep] = useState<'select' | 'name'>('select');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
    const [groupName, setGroupName] = useState('');
    const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (searchQuery.trim().length >= 1) {
            handleSearch();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleSearch = async () => {
        const { data } = await searchProfiles(searchQuery, userId);
        if (data) setSearchResults(data as any as Profile[]);
    };

    const toggleUser = (profile: Profile) => {
        setSelectedUsers(prev =>
            prev.find(u => u.id === profile.id)
                ? prev.filter(u => u.id !== profile.id)
                : [...prev, profile]
        );
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await uploadAvatar(file, `group_${Date.now()}`);
        if (url) setGroupAvatar(url);
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length < 1) return;
        setIsCreating(true);
        try {
            await createGroupChat(
                groupName.trim(),
                selectedUsers.map(u => u.id),
                userId,
                groupAvatar || undefined
            );
            onCreated();
            onClose();
        } finally {
            setIsCreating(false);
        }
    };

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 dark:text-white">Buat Grup Baru</h3>
                        <p className="text-xs text-muted-foreground">{step === 'select' ? 'Pilih anggota grup' : 'Isi info grup'}</p>
                    </div>
                    <button onClick={onClose} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 'select' ? (
                    <div className="p-4">
                        {/* Selected chips */}
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedUsers.map(u => (
                                    <div key={u.id} className="flex items-center gap-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full px-3 py-1 text-xs font-semibold">
                                        {u.display_name || u.email?.split('@')[0]}
                                        <button onClick={() => toggleUser(u)}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari email teman..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 rounded-full"
                            />
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1">
                            {searchResults.map(profile => {
                                const isSelected = !!selectedUsers.find(u => u.id === profile.id);
                                return (
                                    <button
                                        key={profile.id}
                                        onClick={() => toggleUser(profile)}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <Avatar className="w-9 h-9">
                                            <AvatarImage src={profile.avatar_url || undefined} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold">
                                                {getInitials(profile.email || '?')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-semibold">{profile.display_name || profile.email}</p>
                                            {profile.display_name && <p className="text-xs text-muted-foreground">{profile.email}</p>}
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-pink-500" />}
                                    </button>
                                );
                            })}
                            {searchQuery.length >= 1 && searchResults.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada hasil</p>
                            )}
                        </div>

                        <Button
                            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 rounded-full"
                            disabled={selectedUsers.length < 1}
                            onClick={() => setStep('name')}
                        >
                            Lanjut ({selectedUsers.length} dipilih)
                        </Button>
                    </div>
                ) : (
                    <div className="p-5">
                        {/* Group avatar */}
                        <div className="flex flex-col items-center mb-6">
                            <label className="cursor-pointer group">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center overflow-hidden relative shadow-lg mb-2">
                                    {groupAvatar ? (
                                        <img src={groupAvatar} className="w-full h-full object-cover" alt="Group" />
                                    ) : (
                                        <Users className="w-8 h-8 text-white" />
                                    )}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <p className="text-xs text-center text-muted-foreground">Foto Grup</p>
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </label>
                        </div>

                        <Input
                            placeholder="Nama Grup..."
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            className="mb-4 rounded-xl"
                            maxLength={50}
                        />

                        <div className="flex flex-wrap gap-2 mb-5">
                            {selectedUsers.map(u => (
                                <div key={u.id} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-xs">
                                    <Avatar className="w-4 h-4">
                                        <AvatarFallback className="text-[8px]">{getInitials(u.email || '?')}</AvatarFallback>
                                    </Avatar>
                                    {u.display_name || u.email?.split('@')[0]}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                                ← Kembali
                            </Button>
                            <Button
                                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90"
                                disabled={!groupName.trim() || isCreating}
                                onClick={handleCreate}
                            >
                                {isCreating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Buat Grup 🎉'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
