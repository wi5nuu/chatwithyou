import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  MoreVertical,
  Plus,
  Bot,
  UserCircle2,
  MessageCircle,
  Users
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  signOut,
  getUserChats,
  createDirectChat as createChat,
  supabase,
  getPendingRequests
} from '@/lib/supabase';
import { decryptMessage, deriveSharedSecret, importPrivateKey, importPublicKey } from '@/lib/encryption';
import { StatusBar } from '@/components/status/StatusBar';
import { StatusViewer } from '@/components/status/StatusViewer';
import { CreateGroupModal } from '@/components/chat/CreateGroupModal';
import type { Chat, Status, Profile } from '@/types';

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
  const [friends, setFriends] = useState<any[]>([]);
  const [activeNewChatTab, setActiveNewChatTab] = useState<'search' | 'friends'>('search');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadChats();
    loadPendingCount();

    const channel = supabase
      .channel('chat_list_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadChats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        loadPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadPendingCount = async () => {
    try {
      const { data } = await getPendingRequests(userId);
      if (data) setPendingCount(data.length);
    } catch (e) {
      console.error('Error loading pending count:', e);
    }
  };

  useEffect(() => {
    if (newChatDialogOpen) {
      loadFriends();
    }
  }, [newChatDialogOpen]);

  const loadFriends = async () => {
    const { data } = await supabase.from('friendships').select(`
      *,
      sender:sender_id(id, email, display_name, avatar_url, online, last_seen),
      receiver:receiver_id(id, email, display_name, avatar_url, online, last_seen)
    `).or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).eq('status', 'accepted');
    if (data) setFriends(data);
  };

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
              const allMsgs = chat.messages;
              const filteredMsgs = chat.reset_at
                ? allMsgs.filter((m: any) => new Date(m.created_at) > new Date(chat.reset_at))
                : allMsgs;

              if (filteredMsgs.length > 0) {
                lastMessage = filteredMsgs[filteredMsgs.length - 1];
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
            }

            return {
              id: chat.id,
              created_at: chat.created_at,
              reset_at: chat.reset_at,
              is_group: chat.is_group || false,
              name: chat.name || null,
              avatar_url: chat.avatar_url || null,
              participants: chat.participants?.map((p: any) => p.profile),
              last_message: lastMessage,
            };
          })
        );
        setChats(transformedChats.sort((a, b) => {
          const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
          const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
          return timeB - timeA;
        }));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatEmail.trim() || isCreatingChat) return;
    setIsCreatingChat(true);
    setCreateError(null);
    try {
      const { data: profiles } = await supabase.from('profiles').select('id, email').eq('email', newChatEmail.trim());
      if (!profiles || profiles.length === 0) throw new Error('Pengguna tidak ditemukan');
      const targetUserId = profiles[0].id;
      if (targetUserId === userId) throw new Error('Tidak bisa memulai chat dengan diri sendiri');
      const { data, error } = await createChat([userId, targetUserId]);
      if (error) throw error;
      if (data) {
        onSelectChat(data as Chat);
        setNewChatDialogOpen(false);
        setNewChatEmail('');
        loadChats();
      }
    } catch (error: any) {
      setCreateError(error.message);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleStartChatWithFriend = async (friend: Profile) => {
    try {
      const { data, error } = await createChat([userId, friend.id]);
      if (error) throw error;
      if (data) {
        onSelectChat(data as Chat);
        setNewChatDialogOpen(false);
        loadChats();
      }
    } catch (error: any) {
      console.error('Error starting chat with friend:', error);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.is_group) return chat.name || 'Grup Tanpa Nama';
    const otherParticipant = chat.participants?.find(p => p.id !== userId);
    return otherParticipant?.display_name || otherParticipant?.email?.split('@')[0] || 'Unknown';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.is_group) return chat.avatar_url;
    const otherParticipant = chat.participants?.find(p => p.id !== userId);
    return otherParticipant?.avatar_url;
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

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
          <button onClick={onOpenProfile} className="relative group hover:opacity-80 transition-opacity">
            <Avatar className="w-10 h-10 ring-2 ring-pink-500/10 group-hover:ring-pink-500/20 transition-all">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white text-sm font-bold">
                {getInitials(userDisplayName || userEmail)}
              </AvatarFallback>
            </Avatar>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900 animate-in zoom-in duration-300">
                {pendingCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1 min-w-0 flex-1 ml-3 mr-2">
            <div className="text-left min-w-0">
              <p className="font-semibold text-sm truncate">
                {userDisplayName || userEmail.split('@')[0]}
              </p>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-tight">● Online</p>
            </div>
          </div>
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
            className="pl-10 rounded-full bg-gray-100 dark:bg-gray-800 border-transparent focus-visible:ring-offset-0 focus-visible:ring-pink-500/30 transition-all duration-300"
          />
        </div>
      </div>

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
          <div className="text-left flex-1 min-w-0">
            <p className="font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">LoveBot AI</p>
            <p className="text-[10px] text-muted-foreground truncate font-medium uppercase tracking-tight">Asisten romantis cerdas</p>
          </div>
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-10 text-center animate-fade-in">
            <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/10 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
              <MessageCircle className="w-10 h-10 text-pink-500/40" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">Belum ada obrolan</h3>
            <p className="text-xs opacity-60 max-w-[200px] leading-relaxed">Mulai sapa orang-orang tersayangmu dengan mencari email mereka di tombol +</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredChats.map((chat, index) => {
              const isSelected = selectedChat?.id === chat.id;
              const chatName = getChatName(chat);
              const chatAvatar = getChatAvatar(chat);
              const delayClass = `delay-${Math.min((index + 1) * 100, 500)}`;
              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={`w-full flex items-center gap-3 p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 group animate-fade-in-up ${delayClass} ${isSelected ? 'bg-pink-50 dark:bg-pink-900/20' : ''}`}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={chatAvatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white font-bold">
                      {getInitials(chatName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className={`text-sm font-bold truncate ${isSelected ? 'text-pink-600 dark:text-pink-400' : ''}`}>
                        {chatName}
                      </p>
                      {chat.last_message && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {formatTime(chat.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-medium">
                      {getLastMsgPreview(chat)}
                    </p>
                  </div>
                  {isSelected && <div className="absolute left-0 top-3 bottom-3 w-1 bg-pink-500 rounded-r-full" />}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* New Chat Dialog */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 rounded-full">
              <Plus className="mr-2 h-4 w-4" /> Chat Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Mulai Chat Baru</DialogTitle>
              <DialogDescription>Pilih teman atau cari lewat email</DialogDescription>
            </DialogHeader>

            <div className="flex border-b border-gray-100 dark:border-gray-800 px-6">
              <button
                onClick={() => setActiveNewChatTab('friends')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${activeNewChatTab === 'friends' ? 'text-pink-500' : 'text-gray-400'}`}
              >
                Pilih Teman
                {activeNewChatTab === 'friends' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
              </button>
              <button
                onClick={() => setActiveNewChatTab('search')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${activeNewChatTab === 'search' ? 'text-pink-500' : 'text-gray-400'}`}
              >
                Cari Email
                {activeNewChatTab === 'search' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
              </button>
            </div>

            <div className="p-6">
              {activeNewChatTab === 'friends' ? (
                <ScrollArea className="h-64">
                  {friends.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 opacity-50 p-10 text-center">
                      <UserCircle2 className="w-10 h-10" />
                      <p className="text-sm italic">Belum ada teman</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {friends.map(f => {
                        const friend = f.sender_id === userId ? f.receiver : f.sender;
                        return (
                          <button
                            key={f.id}
                            onClick={() => handleStartChatWithFriend(friend)}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={friend?.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white text-xs font-bold">
                                {getInitials(friend?.display_name || friend?.email || '?')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-bold truncate">{friend?.display_name || friend?.email}</p>
                              <p className={`text-[10px] font-bold ${friend?.online ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {friend?.online ? 'Online' : 'Offline'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="space-y-4">
                  {createError && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{createError}</div>}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="email@example.com"
                      value={newChatEmail}
                      onChange={e => { setNewChatEmail(e.target.value); setCreateError(null); }}
                      onKeyDown={e => e.key === 'Enter' && handleCreateChat()}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={handleCreateChat}
                    disabled={isCreatingChat || !newChatEmail.trim()}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-lg shadow-pink-500/20"
                  >
                    {isCreatingChat ? 'Membuat...' : 'Mulai Chat'}
                  </Button>
                </div>
              )}
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
