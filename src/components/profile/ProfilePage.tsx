import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Camera, Edit3, Save, X, User, Mail,
    Info, LogOut, Moon, Sun, ArrowLeft
} from 'lucide-react';
import {
    getProfile, updateProfile, uploadAvatar, signOut,
    sendFriendRequest, getFriends, getPendingRequests, respondToFriendRequest, removeFriend,
    searchProfiles
} from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import type { Profile } from '@/types';

interface ProfilePageProps {
    userId: string;
    userEmail: string;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    onBack: () => void;
    onSignOut: () => void;
    onProfileUpdated?: () => void;
}

export function ProfilePage({ userId, userEmail, darkMode, onToggleDarkMode, onBack, onSignOut, onProfileUpdated }: ProfilePageProps) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [editForm, setEditForm] = useState({ display_name: '', bio: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();

    useEffect(() => {
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        const { data } = await getProfile(userId);
        if (data) {
            const p = data as unknown as Profile;
            setProfile(p);
            setEditForm({
                display_name: p.display_name || '',
                bio: p.bio || '',
            });
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingAvatar(true);
        try {
            console.log('Uploading avatar:', file.name, file.size, 'bytes');
            const url = await uploadAvatar(file, userId);
            console.log('Avatar URL result:', url);
            if (url) {
                const { error } = await updateProfile(userId, { avatar_url: url } as any);
                if (error) {
                    console.error('updateProfile error:', JSON.stringify(error));
                    showToast('Gagal menyimpan foto: ' + error.message, 'error');
                } else {
                    setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
                    showToast('Foto profil berhasil diperbarui! 📸', 'success');
                    onProfileUpdated?.();
                }
            } else {
                showToast('Gagal upload foto — cek Storage RLS policy di Supabase', 'error');
            }
        } catch (err: any) {
            console.error('Avatar upload exception:', err);
            showToast('Error: ' + (err?.message || 'Upload gagal'), 'error');
        } finally {
            setIsUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await updateProfile(userId, {
                display_name: editForm.display_name.trim() || null,
                bio: editForm.bio.trim() || null,
            } as any);
            if (error) {
                console.error('Save profile error:', JSON.stringify(error));
                showToast('Gagal menyimpan: ' + error.message, 'error');
            } else {
                setProfile(prev => prev ? {
                    ...prev,
                    display_name: editForm.display_name.trim() || null,
                    bio: editForm.bio.trim() || null,
                } : prev);
                showToast('Profil berhasil disimpan! ✅', 'success');
                setIsEditing(false);
                onProfileUpdated?.();
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error('SignOut error:', err);
        } finally {
            onSignOut();
        }
    };

    const [activeTab, setActiveTab] = useState<'info' | 'friends'>('info');
    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [searchFriendEmail, setSearchFriendEmail] = useState('');
    const [isSearchingFriend, setIsSearchingFriend] = useState(false);

    useEffect(() => {
        loadProfile();
        if (activeTab === 'friends') {
            loadFriendsData();
        }
    }, [userId, activeTab]);

    const loadFriendsData = async () => {
        const { data: friendsData } = await getFriends(userId);
        const { data: requestsData } = await getPendingRequests(userId);
        if (friendsData) setFriends(friendsData);
        if (requestsData) setPendingRequests(requestsData);
    };

    const handleSendRequest = async () => {
        if (!searchFriendEmail.trim()) return;
        setIsSearchingFriend(true);
        try {
            const { data: searchResults } = await searchProfiles(searchFriendEmail, userId);
            const target = (searchResults as any[])?.find(p => p.email === searchFriendEmail.trim());
            if (target) {
                const { error } = await sendFriendRequest(userId, target.id);
                if (error) showToast('Gagal kirim permintaan: ' + error.message, 'error');
                else {
                    showToast('Permintaan pertemanan terkirim! 💌', 'success');
                    setSearchFriendEmail('');
                }
            } else {
                showToast('Email tidak ditemukan', 'error');
            }
        } finally {
            setIsSearchingFriend(false);
        }
    };

    const handleRespond = async (requestId: string, status: 'accepted' | 'declined') => {
        const { error } = await respondToFriendRequest(requestId, status);
        if (error) showToast('Gagal merespon', 'error');
        else {
            showToast(status === 'accepted' ? 'Pertemanan diterima! 🎉' : 'Permintaan ditolak', 'success');
            loadFriendsData();
        }
    };

    const handleRemoveFriend = async (friendshipId: string) => {
        const { error } = await removeFriend(friendshipId);
        if (error) showToast('Gagal hapus teman', 'error');
        else {
            showToast('Teman dihapus', 'success');
            loadFriendsData();
        }
    };

    const getInitials = (email: string) => email.substring(0, 2).toUpperCase();
    const displayName = profile?.display_name || userEmail;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="font-bold text-lg">Profil Saya</h2>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                    {!isEditing && activeTab === 'info' && (
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                            <Edit3 className="w-5 h-5 text-pink-500" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'info' ? 'text-pink-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Informasi
                    {activeTab === 'info' && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-pink-500 rounded-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'friends' ? 'text-pink-500' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pertemanan
                    {pendingRequests.length > 0 && (
                        <span className="ml-1 bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-gray-900">
                            {pendingRequests.length}
                        </span>
                    )}
                    {activeTab === 'friends' && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-pink-500 rounded-full" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'info' ? (
                    <>
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center py-6 sm:py-10 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
                            <div className="relative mb-4">
                                <div className="absolute -inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full blur-sm opacity-50"></div>
                                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 relative z-10 border-4 border-white dark:border-gray-900 shadow-xl">
                                    <AvatarImage src={profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white text-2xl sm:text-3xl font-bold">
                                        {getInitials(userEmail)}
                                    </AvatarFallback>
                                </Avatar>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    className="absolute bottom-1 right-1 z-20 w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity border-2 border-white dark:border-gray-900"
                                >
                                    {isUploadingAvatar ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Camera className="w-4 h-4" />
                                    )}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white text-center px-4 truncate max-w-full">{displayName}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {profile?.online ? (
                                    <span className="text-green-500 font-semibold">● Online</span>
                                ) : (
                                    'Offline'
                                )}
                            </p>
                        </div>

                        {/* Profile Info */}
                        <div className="p-4 space-y-3">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 text-xs text-pink-500 font-bold uppercase tracking-widest mb-2">
                                    <User className="w-3.5 h-3.5" /> Nama Tampilan
                                </div>
                                {isEditing ? (
                                    <Input
                                        value={editForm.display_name}
                                        onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                                        placeholder="Masukkan nama tampilan..."
                                        className="border-pink-200 focus:border-pink-400"
                                        maxLength={50}
                                    />
                                ) : (
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {profile?.display_name || <span className="text-muted-foreground italic">Belum diisi</span>}
                                    </p>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 text-xs text-blue-500 font-bold uppercase tracking-widest mb-2">
                                    <Mail className="w-3.5 h-3.5" /> Email
                                </div>
                                <p className="text-gray-900 dark:text-white font-medium break-all">{userEmail}</p>
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 text-xs text-purple-500 font-bold uppercase tracking-widest mb-2">
                                    <Info className="w-3.5 h-3.5" /> Bio
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={editForm.bio}
                                        onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                                        placeholder="Ceritakan sedikit tentang dirimu..."
                                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent resize-none outline-none focus:border-pink-300 dark:focus:border-pink-600"
                                        rows={3}
                                        maxLength={150}
                                    />
                                ) : (
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {profile?.bio || <span className="text-muted-foreground italic">Belum ada bio</span>}
                                    </p>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                                        <X className="w-4 h-4 mr-2" /> Batal
                                    </Button>
                                    <Button
                                        className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Simpan
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full mt-4 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-900 dark:hover:bg-red-900/20"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="w-4 h-4 mr-2" /> Keluar dari Akun
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-4 space-y-6">
                        {/* Search Friends */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Tambah Teman</h4>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Email teman..."
                                    value={searchFriendEmail}
                                    onChange={e => setSearchFriendEmail(e.target.value)}
                                    className="rounded-xl border-pink-100 focus:border-pink-400 bg-white dark:bg-gray-900"
                                />
                                <Button
                                    onClick={handleSendRequest}
                                    disabled={isSearchingFriend || !searchFriendEmail}
                                    className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
                                >
                                    {isSearchingFriend ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Kirim'}
                                </Button>
                            </div>
                        </div>

                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-pink-500 uppercase tracking-[0.2em]">Permintaan Masuk</h4>
                                <div className="space-y-2">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-pink-100 dark:border-pink-900/30 flex items-center gap-3 shadow-sm">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={req.sender?.avatar_url} />
                                                <AvatarFallback className="bg-pink-100 text-pink-600 font-bold">{getInitials(req.sender?.email || '')}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{req.sender?.display_name || req.sender?.email}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{req.sender?.email}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-50" onClick={() => handleRespond(req.id, 'accepted')}>
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleRespond(req.id, 'declined')}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Friends List */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Daftar Teman</h4>
                            <div className="space-y-2">
                                {friends.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground text-sm italic">Belum ada teman</div>
                                ) : (
                                    friends.map(f => {
                                        const friendProfile = f.sender_id === userId ? f.receiver : f.sender;
                                        return (
                                            <div key={f.id} className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={friendProfile?.avatar_url} />
                                                    <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">{getInitials(friendProfile?.email || '')}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{friendProfile?.display_name || friendProfile?.email}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {friendProfile?.online ? <span className="text-green-500">● Online</span> : 'Offline'}
                                                    </p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 opacity-50 hover:opacity-100" onClick={() => handleRemoveFriend(f.id)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Bottom spacer for iOS safe area */}
                <div className="h-safe-bottom pb-4" />
            </div>
        </div>
    );
}
