import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Camera, Edit3, Save, X, User, Mail,
    Info, LogOut, Moon, Sun, ArrowLeft
} from 'lucide-react';
import { getProfile, updateProfile, uploadAvatar, signOut } from '@/lib/supabase';
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
        await signOut();
        onSignOut();
    };

    const getInitials = (email: string) => email.substring(0, 2).toUpperCase();
    const displayName = profile?.display_name || userEmail;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="font-bold text-lg">Profil Saya</h2>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                    {!isEditing && (
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                            <Edit3 className="w-5 h-5 text-pink-500" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Avatar Section */}
                <div className="flex flex-col items-center py-10 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative mb-4">
                        <div className="absolute -inset-1 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full blur-sm opacity-50"></div>
                        <Avatar className="w-28 h-28 relative z-10 border-4 border-white dark:border-gray-900 shadow-xl">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white text-3xl font-bold">
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
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{displayName}</h3>
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
                    {/* Display Name */}
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

                    {/* Email */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-2 text-xs text-blue-500 font-bold uppercase tracking-widest mb-2">
                            <Mail className="w-3.5 h-3.5" /> Email
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium">{userEmail}</p>
                    </div>

                    {/* Bio */}
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

                    {/* Action Buttons */}
                    {isEditing ? (
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setIsEditing(false)}
                            >
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
            </div>
        </div>
    );
}
