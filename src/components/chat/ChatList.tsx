import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Plus, MoreVertical, MessageCircle, Bot, Users, UserCircle2
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, getUserChats, createDirectChat as createChat, supabase } from '@/lib/supabase';
import { decryptMessage, deriveSharedSecret, importPrivateKey, importPublicKey } from '@/lib/encryption';
import { StatusBar } from '@/components/status/StatusBar';
import { StatusViewer } from '@/components/status/StatusViewer';
import { CreateGroupModal } from '@/components/chat/CreateGroupModal';
import type { Chat, Status } from '@/types';

interface ChatListProps {
  userId: string;
  userEmail: string;
  userAvatar?: string | null;
  userDisplayName?: string | null;
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAIChat: () => void;
  onOpenProfile: () => void;
}

export function ChatList({
  userId, userEmail, userAvatar, userDisplayName,
  selectedChat, onSelectChat, darkMode, onToggleDarkMode, onOpenAIChat, onOpenProfile
}: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [viewingStatuses, setViewingStatuses] = useState<Status[] | null>(null);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);

  useEffect(() => {
    loadChats();
    const subscription = supabase
      .channel('user-chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadChats())
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [userId]);

  const loadChats = async () => {
    try {
      const { data, error } = await getUserChats(userId);
      if (error) throw error;
      if (data) {
        const transformedChats: Chat[] = await Promise.all(
          data.map(async (item: any) => {
            const chat = item.chats;
            const otherParticipant = chat.participants?.find((p: any) => p.user_id !== userId);
            let lastMessage = null;
            if (chat.messages && chat.messages.length > 0) {
              lastMessage = chat.messages[chat.messages.length - 1];
              try {
                const privateKeyStr = localStorage.getItem('lovechat_private_key');
                if (privateKeyStr && otherParticipant?.profile?.public_key) {
                  const privateKey = await importPrivateKey(privateKeyStr);
                  const publicKey = await importPublicKey(otherParticipant.profile.public_key);
                  const sharedSecret = await deriveSharedSecret(privateKey, publicKey);
                  const decryptedContent = await decryptMessage(sharedSecret, lastMessage.ciphertext, lastMessage.iv);
                  lastMessage.decrypted_content = decryptedContent;
                }
              } catch {
                lastMessage.decrypted_content = lastMessage.type === 'image' ? '📷 Foto' : lastMessage.type === 'video' ? '📹 Video' : '[Encrypted]';
              }
            }
            return {
              id: chat.id,
              created_at: chat.created_at,
              is_group: chat.is_group || false,
              name: chat.name || null,
              avatar_url: chat.avatar_url || null,
              participants: chat.participants?.map((p: any) => p.profile),
              last_message: lastMessage,
            };
          })
        );
        setChats(transformedChats.sort((a, b) => {
          const aTime = a.last_message?.created_at || a.created_at;
          const bTime = b.last_message?.created_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatEmail.trim()) return;
    setIsCreatingChat(true);
    setCreateError(null);
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles').select('*').eq('email', newChatEmail.trim()).single();
      if (profileError || !profiles) { setCreateError('Pengguna tidak ditemukan'); return; }
      if (profiles.id === userId) { setCreateError('Tidak bisa chat dengan diri sendiri'); return; }
      const { data: existingChats } = await supabase.from('chat_participants').select('chat_id').eq('user_id', profiles.id);
      const otherChatIds = existingChats?.map((c: any) => c.chat_id) || [];
      const { data: myExisting } = await supabase.from('chat_participants').select('chat_id').eq('user_id', userId).in('chat_id', otherChatIds);
      if (myExisting && myExisting.length > 0) { setCreateError('Chat sudah ada'); return; }
      const { data: chatData, error: chatError } = await createChat([userId, profiles.id]);
      if (chatError) throw chatError;
      if (chatData) {
        const newChat: Chat = { id: chatData.id, created_at: chatData.created_at, is_group: false, participants: [profiles] };
        setChats([newChat, ...chats]);
        setNewChatEmail('');
        setNewChatDialogOpen(false);
        onSelectChat(newChat);
      }
    } catch (error: any) {
      setCreateError(error.message || 'Gagal membuat chat');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const getChatName = (chat: Chat): string => {
    if (chat.is_group) return chat.name || 'Grup';
    const other = chat.participants?.find(p => p.id !== userId);
    return other?.display_name || other?.email || 'Unknown';
  };

  const getChatAvatar = (chat: Chat): string | null => {
    if (chat.is_group) return chat.avatar_url || null;
    const other = chat.participants?.find(p => p.id !== userId);
    return other?.avatar_url || null;
  };

  const isOnline = (chat: Chat): boolean => {
    if (chat.is_group) return false;
    const other = chat.participants?.find(p => p.id !== userId);
    return !!other?.online;
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const filteredChats = chats.filter(chat => {
    const name = getChatName(chat);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getLastMsgPreview = (chat: Chat): string => {
    if (!chat.last_message) return 'Belum ada pesan';
    const t = chat.last_message.type;
    if (t === 'image') return '📷 Foto';
    if (t === 'video') return '📹 Video';
    if (t === 'voice') return '🎤 Pesan Suara';
    return chat.last_message.decrypted_content || '[Encrypted]';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onOpenProfile} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="w-10 h-10">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white text-sm font-bold">
                {getInitials(userDisplayName || userEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-semibold text-sm truncate max-w-[120px]">
                {userDisplayName || userEmail.split('@')[0]}
              </p>
              <p className="text-xs text-green-500 font-semibold">● Online</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-gray-500" onClick={() => setShowGroupModal(true)} title="Buat Grup">
              <Users className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpenProfile}>
                  <UserCircle2 className="mr-2 h-4 w-4" /> Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleDarkMode}>
                  Tema {darkMode ? 'Terang' : 'Gelap'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut().then(() => window.location.reload())} className="text-red-500">
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari chat..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full bg-gray-100 dark:bg-gray-800 border-transparent"
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar userId={userId} onViewStatus={(statuses) => setViewingStatuses(statuses)} />

      {/* AI Chat Button */}
      <div className="px-3 pt-3 pb-1">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-2xl"
          onClick={onOpenAIChat}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm">LoveBot AI</p>
            <p className="text-xs text-muted-foreground">Asisten romantis kamu</p>
          </div>
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">Belum ada chat</p>
            <p className="text-xs text-muted-foreground mt-1">Buat chat baru dengan tombol di bawah</p>
          </div>
        ) : (
          <div>
            {filteredChats.map(chat => {
              const name = getChatName(chat);
              const avatarUrl = getChatAvatar(chat);
              const online = isOnline(chat);
              const isSelected = selectedChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? 'bg-pink-50 dark:bg-pink-900/10 border-r-2 border-pink-500' : ''}`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className={`text-white font-bold ${chat.is_group ? 'bg-gradient-to-br from-purple-500 to-indigo-500' : 'bg-gradient-to-br from-pink-500 to-rose-500'}`}>
                        {chat.is_group ? <Users className="w-5 h-5" /> : getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    {online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      {chat.last_message && (
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {formatTime(chat.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{getLastMsgPreview(chat)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* New Chat Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 rounded-full">
              <Plus className="mr-2 h-4 w-4" /> Chat Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chat Baru</DialogTitle>
              <DialogDescription>Masukkan email pengguna yang ingin kamu chat</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {createError && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{createError}</div>}
              <Input
                placeholder="email@example.com"
                value={newChatEmail}
                onChange={e => { setNewChatEmail(e.target.value); setCreateError(null); }}
                onKeyDown={e => e.key === 'Enter' && handleCreateChat()}
              />
              <Button
                onClick={handleCreateChat}
                disabled={isCreatingChat || !newChatEmail.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
              >
                {isCreatingChat ? 'Membuat...' : 'Mulai Chat'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modals */}
      {showGroupModal && (
        <CreateGroupModal
          userId={userId}
          onClose={() => setShowGroupModal(false)}
          onCreated={loadChats}
        />
      )}
      {viewingStatuses && (
        <StatusViewer
          statuses={viewingStatuses}
          onClose={() => setViewingStatuses(null)}
        />
      )}
    </div>
  );
}
