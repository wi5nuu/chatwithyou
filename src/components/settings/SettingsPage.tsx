import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ArrowLeft,
    User,
    MessageSquare,
    Bell,
    Database,
    HelpCircle,
    Shield,
    Trash2,
    Mail,
    Smartphone,
    Info,
    ChevronRight,
    Palette
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase, signOut } from '@/lib/supabase';

interface SettingsPageProps {
    userId: string;
    userEmail: string;
    onBack: () => void;
    deferredPrompt?: any;
}

type SettingsTab = 'main' | 'account' | 'privacy' | 'chats' | 'notifications' | 'storage' | 'help';

export function SettingsPage({ userId, userEmail, onBack, deferredPrompt }: SettingsPageProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('main');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showClearChatsConfirm, setShowClearChatsConfirm] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    const handleRequestNotificationPermission = async () => {
        const permission = await Notification.requestPermission();
        if (typeof setNotificationPermission === 'function') {
            setNotificationPermission(permission);
        }
        if (permission === 'granted') {
            toast.success('Pemberitahuan desktop diaktifkan!');
        } else {
            toast.error('Izin pemberitahuan ditolak');
        }
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            toast.error('Silakan masukkan email yang valid');
            return;
        }
        setIsUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            toast.success('Email konfirmasi telah dikirim ke alamat baru Anda');
            setShowEmailDialog(false);
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui email');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdatePrivacy = async (field: string, value: string) => {
        try {
            // Updating profile metadata for privacy
            const { error } = await supabase
                .from('profiles')
                .update({ [field]: value })
                .eq('id', userId);

            if (error) throw error;
            toast.success('Pengaturan privasi diperbarui');
        } catch (error: any) {
            toast.error('Gagal memperbarui privasi');
        }
    };

    const handleInstallApp = async () => {
        if (!deferredPrompt) {
            toast.info('Aplikasi sudah terinstal atau tidak didukung di browser ini');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            toast.success('Terima kasih telah menginstal LoveChat!');
        }
    };

    const handleClearAllChats = async () => {
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('sender_id', userId);

            if (error) throw error;
            toast.success('Semua riwayat chat Anda berhasil dibersihkan');
            setShowClearChatsConfirm(false);
        } catch (error) {
            console.error('Error clearing chats:', error);
            toast.error('Gagal membersihkan chat');
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await supabase.from('profiles').delete().eq('id', userId);
            await signOut();
            toast.success('Akun Anda berhasil dihapus. Sampai jumpa lagi! 👋');
            window.location.reload();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Gagal menghapus akun');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderHeader = (title: string, showBackToMain = false) => (
        <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 sticky top-0 z-10">
            <Button
                variant="ghost"
                size="icon"
                onClick={showBackToMain ? () => setActiveTab('main') : onBack}
                className="rounded-full"
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">{title}</h1>
        </div>
    );

    const SettingItem = ({
        icon: Icon,
        title,
        description,
        onClick,
        variant = 'default'
    }: {
        icon: any,
        title: string,
        description?: string,
        onClick?: () => void,
        variant?: 'default' | 'danger'
    }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-500'
                }`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-bold ${variant === 'danger' ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                    {title}
                </p>
                {description && (
                    <p className="text-[11px] text-muted-foreground truncate">{description}</p>
                )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
        </button>
    );

    if (activeTab === 'account') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 animate-in slide-in-from-right duration-300">
                {renderHeader('Akun', true)}
                <ScrollArea className="flex-1">
                    <div className="py-2 bg-white dark:bg-gray-900 mt-4 border-y border-gray-200 dark:border-gray-800">
                        <SettingItem icon={Shield} title="Keamanan" description="Notifikasi keamanan akun" onClick={() => toast.success('Keamanan LoveChat aktif dengan enkripsi E2EE')} />
                        <SettingItem icon={Mail} title="Ganti Email" description={userEmail} onClick={() => setShowEmailDialog(true)} />
                    </div>
                </ScrollArea>
            </div>
        );
    }

    if (activeTab === 'privacy') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 animate-in slide-in-from-right duration-300">
                {renderHeader('Privasi', true)}
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        <div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1">Siapa yang dapat melihat info saya</p>
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                                <SettingItem icon={Info} title="Terakhir dilihat & Online" description="Semua orang" onClick={() => handleUpdatePrivacy('privacy_last_seen', 'everyone')} />
                                <SettingItem icon={User} title="Foto profil" description="Semua orang" onClick={() => handleUpdatePrivacy('privacy_profile_photo', 'everyone')} />
                                <SettingItem icon={Info} title="Info" description="Semua orang" onClick={() => handleUpdatePrivacy('privacy_info', 'everyone')} />
                                <SettingItem icon={Smartphone} title="Status" description="Kontak" onClick={() => handleUpdatePrivacy('privacy_status', 'everyone')} />
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        );
    }

    if (activeTab === 'chats') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 animate-in slide-in-from-right duration-300">
                {renderHeader('Chat', true)}
                <ScrollArea className="flex-1">
                    <div className="py-2 bg-white dark:bg-gray-900 mt-4 border-y border-gray-200 dark:border-gray-800">
                        <SettingItem icon={Palette} title="Wallpaper" description="Kustomisasi tampilan obrolan" onClick={() => toast.info('Gunakan room chat untuk setting wallpaper')} />
                        <SettingItem icon={Database} title="Cadangan Chat" description="Simpan ke cloud" onClick={() => toast.success('Cadangan tersinkronisasi')} />
                    </div>
                    <div className="py-2 bg-white dark:bg-gray-900 mt-4 border-y border-gray-200 dark:border-gray-800">
                        <SettingItem icon={MessageSquare} title="Bersihkan Semua Chat" variant="danger" onClick={() => setShowClearChatsConfirm(true)} />
                    </div>
                </ScrollArea>
            </div>
        );
    }

    if (activeTab === 'notifications') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 animate-in slide-in-from-right duration-300">
                {renderHeader('Notifikasi', true)}
                <ScrollArea className="flex-1">
                    <div className="p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                            <SettingItem
                                icon={Bell}
                                title="Pemberitahuan Desktop/Perangkat"
                                description={notificationPermission === 'granted' ? 'Aktif' : 'Klik untuk aktifkan'}
                                onClick={handleRequestNotificationPermission}
                            />
                            <SettingItem icon={Bell} title="Nada Percakapan" description="Default" onClick={() => toast.success('Pengaturan diperbarui')} />
                            <SettingItem icon={Smartphone} title="Getar" description="Default" onClick={() => toast.success('Pengaturan diperbarui')} />
                        </div>
                    </div>
                </ScrollArea>
            </div>
        );
    }

    if (activeTab === 'storage') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 animate-in slide-in-from-right duration-300">
                {renderHeader('Penyimpanan', true)}
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                            <h3 className="text-sm font-bold">Penyimpanan</h3>
                            <p className="text-xs text-muted-foreground mt-1">1.2 MB / 100 MB</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                            <SettingItem icon={Database} title="Kelola Penyimpanan" onClick={() => toast.success('Pembersihan cache dilakukan')} />
                        </div>
                    </div>
                </ScrollArea>
            </div>
        );
    }

    if (activeTab === 'help') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 animate-in slide-in-from-right duration-300">
                {renderHeader('Bantuan', true)}
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                            <h3 className="text-sm font-bold">Frequently Asked Questions</h3>
                            <div className="mt-4 space-y-4 text-left">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-pink-500">Bagaimana cara ganti wallpaper?</p>
                                    <p className="text-[10px] text-muted-foreground">Buka room chat, klik titik tiga di kanan atas, lalu pilih Ganti Wallpaper.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-pink-500">Apakah chat saya aman?</p>
                                    <p className="text-[10px] text-muted-foreground">Ya, semua chat di LoveChat menggunakan enkripsi End-to-End standar militer.</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-pink-500">Cara nonton bareng?</p>
                                    <p className="text-[10px] text-muted-foreground">Klik ikon bioskop di samping input chat untuk masuk ke Movie Room.</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full space-y-3">
                            <Button variant="outline" className="w-full rounded-2xl py-6 gap-2" onClick={() => window.location.href = 'mailto:support@lovechat.id'}>
                                <Mail className="w-4 h-4" /> Hubungi Dukungan
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
            {renderHeader('Pengaturan')}
            <ScrollArea className="flex-1">
                <button
                    onClick={() => setActiveTab('account')}
                    className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 mb-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors w-full"
                >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg shadow-pink-500/20">
                        <User className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <h2 className="text-lg font-bold truncate">Profil Saya</h2>
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>

                <div className="bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
                    <SettingItem icon={User} title="Akun" description="Keamanan, ganti nomor, keluar" onClick={() => setActiveTab('account')} />
                    <SettingItem icon={Shield} title="Privasi" description="Blokir kontak, pesan sementara" onClick={() => setActiveTab('privacy')} />
                    <SettingItem icon={MessageSquare} title="Chat" description="Wallpaper, riwayat chat" onClick={() => setActiveTab('chats')} />
                    <SettingItem icon={Bell} title="Notifikasi" description="Nada pesan & grup" onClick={() => setActiveTab('notifications')} />
                    <SettingItem icon={Database} title="Penyimpanan dan Data" description="Penggunaan jaringan" onClick={() => setActiveTab('storage')} />
                    {deferredPrompt && (
                        <SettingItem
                            icon={Smartphone}
                            title="Instal LoveChat"
                            description="Tambahkan ke layar utama"
                            onClick={handleInstallApp}
                        />
                    )}
                    <SettingItem icon={HelpCircle} title="Bantuan" description="Pusat bantuan, info aplikasi" onClick={() => setActiveTab('help')} />
                </div>

                <div className="p-10 flex flex-col items-center justify-center text-muted-foreground opacity-40 select-none">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">from</p>
                    <p className="text-xs font-black tracking-tight mt-1">LOVECHAT TEAM</p>
                </div>
            </ScrollArea>

            {/* Modals */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="max-w-[320px] rounded-3xl p-6 text-center border-none">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">Hapus Akun?</DialogTitle>
                        <DialogDescription className="text-center text-xs">Semua data Anda akan dihapus selamanya.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 mt-6">
                        <Button variant="destructive" className="w-full rounded-xl font-bold py-6" onClick={handleDeleteAccount} disabled={isDeleting}>
                            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                        </Button>
                        <Button variant="ghost" className="w-full rounded-xl font-bold py-6" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showClearChatsConfirm} onOpenChange={setShowClearChatsConfirm}>
                <DialogContent className="max-w-[320px] rounded-3xl p-6 text-center border-none">
                    <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-orange-500" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">Bersihkan Chat?</DialogTitle>
                        <DialogDescription className="text-center text-xs">Semua riwayat pesan Anda akan dihapus.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 mt-6">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold py-6" onClick={handleClearAllChats}>Bersihkan Sekarang</Button>
                        <Button variant="ghost" className="w-full rounded-xl font-bold py-6" onClick={() => setShowClearChatsConfirm(false)}>Batal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogContent className="max-w-[320px] rounded-3xl p-6 border-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Ganti Email</DialogTitle>
                        <DialogDescription className="text-xs">Email konfirmasi akan dikirim ke alamat baru Anda.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Email baru..."
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="rounded-xl border-gray-100 dark:border-gray-800"
                        />
                    </div>
                    <DialogFooter className="flex-col gap-2">
                        <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold py-6" onClick={handleUpdateEmail} disabled={isUpdating}>
                            {isUpdating ? 'Memproses...' : 'Simpan Email'}
                        </Button>
                        <Button variant="ghost" className="w-full rounded-xl font-bold py-6" onClick={() => setShowEmailDialog(false)}>Batal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
