import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone, Video, MoreVertical, Send, Mic, Play, Pause,
  ChevronLeft, Sparkles, Lock, SmilePlus, Reply, CheckCheck, X, Users, Paperclip, Plus,
  Ghost, Image as ImageIcon, Trash2, Clock, BarChart2, MapPin, ExternalLink
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getMessages, sendMessage, getOtherParticipant, uploadImage, uploadVideo, createPoll, markMessagesAsRead } from '@/lib/supabase';
import { useRealtimeMessages, useTypingIndicator } from '@/hooks/useRealtime';
import { useVoiceRecorder, useVoicePlayer } from '@/hooks/useVoiceRecorder';
import { useAI } from '@/hooks/useAI';
import { encryptMessage, decryptMessage, deriveSharedSecret, importPrivateKey, importPublicKey } from '@/lib/encryption';
import type { Chat, Message } from '@/types';
import { CallModal } from '../call/CallModal';
import { CreatePollModal } from './CreatePollModal';
import { PollMessage } from './PollMessage';

interface ChatRoomProps {
  chat: Chat;
  userId: string;
  userEmail: string;
  onBack?: () => void;
  isMobile?: boolean;
}

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];
const EMOJI_PICKER_LIST = ['😀', '😍', '🥰', '😘', '💕', '❤️', '🔥', '✨', '🙈', '😂', '🥺', '👏', '🙏', '💯', '🎉', '🌹'];

export function ChatRoom({ chat, userId, onBack, isMobile }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [sharedSecret, setSharedSecret] = useState<CryptoKey | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [reactionMenuId, setReactionMenuId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const [vanishMode, setVanishMode] = useState(false);
  const [vanishTimer, setVanishTimer] = useState<number>(3600); // Default 1 hour in seconds
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isRecording, recordingTime, audioBase64, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();
  const { isPlaying, currentTime, duration, playAudio, pauseAudio } = useVoicePlayer();
  const { sendTyping } = useTypingIndicator(chat.id, userId, (_, typing) => setIsTyping(typing));
  const { suggestReply } = useAI();

  useEffect(() => { initializeChat(); }, [chat.id, userId]);
  useRealtimeMessages(chat.id, (msg) => decryptAndAddMessage(msg), (updatedMsg) => {
    setMessages((prev: Message[]) => prev.map(m => m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m));
  });

  useEffect(() => {
    if (chat.id && userId) {
      markMessagesAsRead(chat.id, userId);
    }
  }, [chat.id, userId, messages.length]);

  // Auto-expire messages check
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setMessages(prev => prev.filter(msg => {
        if (!msg.expires_at) return true;
        return new Date(msg.expires_at) > now;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedWallpaper = localStorage.getItem(`wallpaper_${chat.id}`);
    if (savedWallpaper) setWallpaper(savedWallpaper);
  }, [chat.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setMessages([]);
      setSharedSecret(null);

      if (!chat.is_group) {
        const { data: participantData } = (await getOtherParticipant(chat.id, userId)) as any;
        if (participantData?.profile) setOtherUser(participantData.profile);
        const privateKeyStr = localStorage.getItem('lovechat_private_key');
        if (privateKeyStr && participantData?.profile?.public_key) {
          const privateKey = await importPrivateKey(privateKeyStr);
          const publicKey = await importPublicKey(participantData.profile.public_key);
          const secret = await deriveSharedSecret(privateKey, publicKey);
          setSharedSecret(secret);
          const { data: messagesData } = (await getMessages(chat.id)) as any;
          if (messagesData) {
            const decrypted = await Promise.all(messagesData.map(async (msg: any) => {
              if (msg.ciphertext) {
                try {
                  const text = await decryptMessage(secret, msg.ciphertext, msg.iv);
                  return { ...msg, decrypted_content: text } as Message;
                } catch { return { ...msg, decrypted_content: '[Tidak bisa didekripsi]' } as Message; }
              }
              return msg as Message;
            }));
            setMessages(decrypted);
          } else {
            const { data: messagesData } = (await getMessages(chat.id)) as any;
            if (messagesData) setMessages(messagesData as Message[]);
          }
        } else {
          const { data: messagesData } = (await getMessages(chat.id)) as any;
          if (messagesData) setMessages(messagesData as Message[]);
        }
      } else {
        const { data: messagesData } = (await getMessages(chat.id)) as any;
        if (messagesData) setMessages(messagesData as Message[]);
      }
    } catch (error) { console.error('Error initializing chat:', error); }
    finally { setIsLoading(false); }
  };

  const decryptAndAddMessage = async (message: any) => {
    if (message.sender_id === userId) return;
    if (sharedSecret && message.ciphertext) {
      try {
        const text = await decryptMessage(sharedSecret, message.ciphertext, message.iv);
        const dm = { ...message, decrypted_content: text } as Message;
        setMessages((prev: Message[]) => [...prev, dm]);
        const suggestion = await suggestReply([text]);
        setAiSuggestion(suggestion);
      } catch (error) {
        setMessages((prev: Message[]) => [...prev, { ...message, decrypted_content: '[Encrypted]' } as Message]);
      }
    } else if (chat.is_group) {
      setMessages((prev: Message[]) => [...prev, message as Message]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !sharedSecret) return;
    try {
      const text = replyTo
        ? `↩️ [Reply: "${(replyTo.decrypted_content || '').substring(0, 30)}..."]\n${newMessage.trim()}`
        : newMessage.trim();
      const encrypted = await encryptMessage(sharedSecret, text);

      const expires_at = vanishMode
        ? new Date(Date.now() + vanishTimer * 1000).toISOString()
        : null;

      const { data } = await sendMessage({
        chat_id: chat.id,
        sender_id: userId,
        type: 'text',
        ...encrypted,
        expires_at
      });
      if (data) {
        setMessages((prev: Message[]) => [...prev, { ...data, decrypted_content: text } as Message]);
        setNewMessage('');
        setAiSuggestion(null);
        setReplyTo(null);
      }
    } catch (error) { console.error('Send error:', error); }
  };

  const handleSendVoice = async () => {
    if (!audioBase64 || !sharedSecret) return;
    try {
      const encrypted = await encryptMessage(sharedSecret, audioBase64);
      const { data } = await sendMessage({ chat_id: chat.id, sender_id: userId, type: 'voice', ...encrypted });
      if (data) setMessages((prev: Message[]) => [...prev, { ...data, decrypted_content: audioBase64 } as Message]);
    } catch (error) { console.error('Voice error:', error); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview({ file, url });
    e.target.value = '';
  };

  const handleSendMedia = async () => {
    if (!imagePreview) return;
    setIsUploadingMedia(true);
    try {
      const { file } = imagePreview;
      const isVideo = file.type.startsWith('video/');
      const publicUrl = isVideo
        ? await uploadVideo(file, userId)
        : await uploadImage(file, userId);
      if (!publicUrl) throw new Error('Upload failed');

      // For media, store the public URL as the "content" (no encryption needed for public media)
      // But we still send a message record. We'll store the URL directly in decrypted_content
      const placeholder = publicUrl;
      // If sharedSecret exists, encrypt the URL so it's stored securely
      let messagePayload: any;
      if (sharedSecret) {
        const encrypted = await encryptMessage(sharedSecret, placeholder);
        messagePayload = {
          chat_id: chat.id,
          sender_id: userId,
          type: isVideo ? 'video' : 'image',
          ...encrypted,
          expires_at: vanishMode ? new Date(Date.now() + vanishTimer * 1000).toISOString() : null
        };
      } else {
        messagePayload = {
          chat_id: chat.id,
          sender_id: userId,
          type: isVideo ? 'video' : 'image',
          decrypted_content: placeholder
        };
      }

      const { data } = await sendMessage(messagePayload);
      if (data) {
        setMessages((prev: Message[]) => [...prev, { ...data, decrypted_content: publicUrl } as Message]);
      }
    } catch (error) { console.error('Media send error:', error); }
    finally {
      setIsUploadingMedia(false);
      setImagePreview(null);
      URL.revokeObjectURL(imagePreview.url);
    }
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation || !sharedSecret) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const locationData = { lat: latitude, lng: longitude };
      const placeholder = `https://www.google.com/maps?q=${latitude},${longitude}`;

      try {
        const encrypted = await encryptMessage(sharedSecret, placeholder);
        const { data } = await sendMessage({
          chat_id: chat.id,
          sender_id: userId,
          type: 'location',
          ...encrypted,
          location: locationData,
          expires_at: vanishMode ? new Date(Date.now() + vanishTimer * 1000).toISOString() : null
        } as any);

        if (data) {
          setMessages((prev: Message[]) => [...prev, { ...data, decrypted_content: placeholder, location: locationData } as Message]);
        }
      } catch (error) {
        console.error('Location share error:', error);
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      alert('Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.');
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTyping(true);
  };

  const scrollToBottom = () => scrollRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleAddReaction = (messageId: string, emoji: string) => {
    setReactions(prev => ({ ...prev, [messageId]: prev[messageId] === emoji ? '' : emoji }));
    setReactionMenuId(null);
  };

  const handleEmojiInsert = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const getInitials = (name: string) => (name || '??').substring(0, 2).toUpperCase();
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const chatTitle = chat.is_group
    ? chat.name || 'Grup'
    : otherUser?.display_name || otherUser?.email || 'Loading...';
  const chatAvatarUrl = chat.is_group ? chat.avatar_url : otherUser?.avatar_url;

  const isMedia = (msg: Message) => msg.type === 'image' || msg.type === 'video';

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="relative shrink-0">
            <Avatar className="w-10 h-10">
              <AvatarImage src={chatAvatarUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-500 text-white text-sm font-bold">
                {chat.is_group ? <Users className="w-4 h-4" /> : getInitials(chatTitle)}
              </AvatarFallback>
            </Avatar>
            {!chat.is_group && otherUser?.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{chatTitle}</p>
            <div className="flex items-center gap-1">
              {isTyping ? (
                <span className="text-xs text-pink-500 flex items-center gap-1">
                  <span className="flex gap-0.5">
                    {[0, 150, 300].map(d => <span key={d} className="w-1 h-1 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </span> Mengetik
                </span>
              ) : !chat.is_group && otherUser?.online ? (
                <p className="text-xs text-green-500 font-semibold">● Online</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {chat.is_group ? `${chat.participants?.length || 0} anggota` : `Terakhir dilihat ${otherUser?.last_seen ? formatTime(otherUser.last_seen) : ''}`}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!chat.is_group && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`transition-colors ${vanishMode ? 'text-pink-500 bg-pink-50' : 'text-gray-500'}`}
                >
                  <Ghost className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setVanishMode(true); setVanishTimer(60); }}>Vanish Mode (1 Menit)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setVanishMode(true); setVanishTimer(3600); }}>Vanish Mode (1 Jam)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVanishMode(false)} className="text-red-500">Matikan Vanish Mode</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* On Desktop: Show call icons directly. On Mobile: Hide them if space is low or group them */}
          {!isMobile && (
            <>
              <Button variant="ghost" size="icon" onClick={() => { setCallType('voice'); setShowCallModal(true); }} className="text-gray-500 hover:text-pink-500">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setCallType('video'); setShowCallModal(true); }} className="text-gray-500 hover:text-pink-500">
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isMobile && (
                <>
                  <DropdownMenuItem onClick={() => { setCallType('voice'); setShowCallModal(true); }}>
                    <Phone className="w-4 h-4 mr-2" /> Telepon Suara
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setCallType('video'); setShowCallModal(true); }}>
                    <Video className="w-4 h-4 mr-2" /> Video Call
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => {
                const url = prompt('Masukkan URL gambar wallpaper (atau biarkan kosong untuk default):');
                if (url !== null) {
                  setWallpaper(url || null);
                  if (url) localStorage.setItem(`wallpaper_${chat.id}`, url);
                  else localStorage.removeItem(`wallpaper_${chat.id}`);
                }
              }}>
                <ImageIcon className="w-4 h-4 mr-2" /> Ganti Wallpaper
              </DropdownMenuItem>
              <DropdownMenuItem>Lihat Profil</DropdownMenuItem>
              <DropdownMenuItem>Bersihkan Chat</DropdownMenuItem>
              {!chat.is_group && <DropdownMenuItem className="text-red-500">Blokir</DropdownMenuItem>}
              {chat.is_group && <DropdownMenuItem className="text-red-500">Keluar Grup</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Image Preview before send */}
      {imagePreview && (
        <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="relative inline-block">
            {imagePreview.file.type.startsWith('video/') ? (
              <video src={imagePreview.url} className="max-h-40 max-w-full rounded-2xl object-cover" />
            ) : (
              <img src={imagePreview.url} alt="preview" className="max-h-40 max-w-full rounded-2xl object-cover" />
            )}
            <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setImagePreview(null)}>Batal</Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white"
              onClick={handleSendMedia}
              disabled={isUploadingMedia}
            >
              {isUploadingMedia ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
              ) : <Send className="w-4 h-4 mr-1" />}
              Kirim
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea
        className="flex-1 relative"
        style={{
          backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {wallpaper && <div className="absolute inset-0 bg-white/60 dark:bg-gray-950/60 pointer-events-none" />}
        <div className="relative p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="w-2/3 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-pink-500/20">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Pesan Terenkripsi</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Hanya kamu dan {chatTitle} yang bisa membaca pesan ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.sender_id === userId;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                const hasReaction = reactions[message.id];
                const isMediaMsg = isMedia(message);
                const sender = message.sender as any;

                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2 group`}>
                    {!isOwn && (
                      <div className="w-8 shrink-0">
                        {showAvatar && (
                          <Avatar className="w-8 h-8 border border-gray-100 dark:border-gray-800">
                            <AvatarImage src={sender?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px] font-bold">
                              {getInitials(sender?.display_name || sender?.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[75%]`}>
                      {chat.is_group && !isOwn && showAvatar && (
                        <p className="text-[10px] text-pink-500 font-bold mb-1 ml-1">
                          {sender?.display_name || sender?.email?.split('@')[0] || 'User'}
                        </p>
                      )}

                      <div className={`relative flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        {message.expires_at && (
                          <div className={`flex items-center gap-1 mb-1 text-[9px] font-bold uppercase tracking-wider ${isOwn ? 'text-pink-500' : 'text-pink-400'}`}>
                            <Clock className="w-2.5 h-2.5" />
                            <span>Vanish: {Math.max(1, Math.ceil((new Date(message.expires_at).getTime() - Date.now()) / 1000 / 60))}m</span>
                          </div>
                        )}

                        <div className={`px-4 py-2 rounded-2xl relative shadow-sm ${isOwn
                          ? isMediaMsg ? 'bg-transparent p-0' : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none'
                          : isMediaMsg ? 'bg-transparent p-0' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                          }`}>
                          {message.type === 'image' ? (
                            <img
                              src={message.decrypted_content || ''}
                              alt="Foto"
                              className="max-w-full max-h-[200px] sm:max-h-[300px] rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(message.decrypted_content || '', '_blank')}
                            />
                          ) : message.type === 'video' ? (
                            <video
                              src={message.decrypted_content || ''}
                              controls
                              className="max-w-full max-h-[200px] sm:max-h-[300px] rounded-xl"
                            />
                          ) : message.type === 'voice' ? (
                            <div className="flex items-center gap-2 py-1 min-w-[150px]">
                              <Button variant="ghost" size="icon" className={`w-8 h-8 rounded-full ${isOwn ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 text-pink-500'}`}
                                onClick={() => isPlaying ? pauseAudio() : message.decrypted_content && playAudio(message.decrypted_content)}>
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </Button>
                              <div className="flex-1">
                                <div className={`h-1.5 rounded-full ${isOwn ? 'bg-white/30' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                  <div className={`h-full rounded-full ${isOwn ? 'bg-white' : 'bg-pink-500'}`} style={{ width: `${isPlaying ? (currentTime / duration) * 100 : 0}%` }} />
                                </div>
                              </div>
                            </div>
                          ) : message.type === 'poll' ? (
                            <PollMessage poll={message.poll!} userId={userId} />
                          ) : message.type === 'location' ? (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer"
                                onClick={() => window.open(`https://www.google.com/maps?q=${message.location?.lat},${message.location?.lng}`, '_blank')}>
                                <div className="h-24 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center relative">
                                  <MapPin className="w-8 h-8 text-pink-500 animate-bounce" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                <div className="p-2 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                                  Lihat Lokasi Saya di Google Maps
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {message.decrypted_content?.match(/https?:\/\/[^\s]+/) && (
                                <LinkPreview url={message.decrypted_content!.match(/https?:\/\/[^\s]+/)![0]} />
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.decrypted_content || '[Encrypted]'}</p>
                            </div>
                          )}

                          {/* Reactions */}
                          {hasReaction && (
                            <div className="absolute -bottom-2 -right-2 flex">
                              <span className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full px-1.5 py-0.5 text-[12px] shadow-md scale-90">
                                {hasReaction}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <p className="text-[10px] text-muted-foreground/70 font-medium">{formatTime(message.created_at)}</p>
                        {isOwn && <CheckCheck className={`w-3 h-3 ${message.is_read ? 'text-pink-500' : (message.expires_at ? 'text-pink-400' : 'text-blue-400')}`} />}

                        {/* Hover actions */}
                        <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <button onClick={() => setReactionMenuId(reactionMenuId === message.id ? null : message.id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-muted-foreground/60">
                            <SmilePlus className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setReplyTo(message)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-muted-foreground/60">
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {reactionMenuId === message.id && (
                        <div className="flex gap-1 mt-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-100 dark:border-gray-700 z-10">
                          {EMOJI_REACTIONS.map(emoji => (
                            <button key={emoji} onClick={() => handleAddReaction(message.id, emoji)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-125 transition-transform">
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* AI Suggestion */}
      {aiSuggestion && (
        <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-t border-purple-100 dark:border-purple-800 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <button onClick={() => { setNewMessage(aiSuggestion); setAiSuggestion(null); }} className="text-xs text-purple-700 dark:text-purple-300 hover:underline text-left truncate italic">
              " {aiSuggestion} "
            </button>
          </div>
          <button onClick={() => setAiSuggestion(null)} className="p-1 hover:bg-white/50 rounded-full shrink-0"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="w-1 h-8 bg-pink-500 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-pink-500 uppercase">Membalas</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.decrypted_content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        {showEmojiPicker && (
          <div className="mb-2 p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-xl max-w-full overflow-hidden">
            <div className="flex flex-wrap gap-1 justify-center">
              {EMOJI_PICKER_LIST.map(emoji => (
                <button key={emoji} onClick={() => handleEmojiInsert(emoji)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xl hover:scale-125 transition-transform">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {isRecording ? (
          <div className="flex items-center justify-between bg-pink-50 dark:bg-pink-900/20 rounded-full px-4 py-2 border border-pink-200 dark:border-pink-800 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-sm font-bold text-pink-600 dark:text-pink-400 tracking-tight">VOICE RECORDING {formatDuration(recordingTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/40" onClick={cancelRecording}>
                <Trash2 className="w-4 h-4 text-pink-500" />
              </Button>
              <Button size="icon" className="w-9 h-9 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg shadow-pink-500/20" onClick={() => { stopRecording(); setTimeout(handleSendVoice, 500); }}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            {!isMobile ? (
              <>
                <Button variant="ghost" size="icon" className={`shrink-0 w-10 h-10 rounded-full transition-colors ${showEmojiPicker ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'text-gray-400 hover:text-pink-500'}`} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <SmilePlus className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0 w-10 h-10 rounded-full text-gray-400 hover:text-pink-500" onClick={() => setShowPollModal(true)}>
                  <BarChart2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0 w-10 h-10 rounded-full text-gray-400 hover:text-pink-500" onClick={handleShareLocation}>
                  <MapPin className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0 w-10 h-10 rounded-full text-gray-400 hover:text-pink-500" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 w-10 h-10 rounded-full text-gray-400 hover:text-pink-500">
                    <Plus className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="mb-2">
                  <DropdownMenuItem onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <SmilePlus className="w-4 h-4 mr-2" /> Emoji
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="w-4 h-4 mr-2" /> Media/File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPollModal(true)}>
                    <BarChart2 className="w-4 h-4 mr-2" /> Polling
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareLocation}>
                    <MapPin className="w-4 h-4 mr-2" /> Lokasi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            <div className="flex-1 relative group">
              <Input
                ref={inputRef}
                placeholder={vanishMode ? "Ketik pesan rahasia..." : "Ketik pesan..."}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`w-full rounded-2xl bg-gray-100 dark:bg-gray-800 border-none px-4 py-2.5 focus:ring-2 transition-all text-sm ${vanishMode ? 'focus:ring-pink-500/30' : 'focus:ring-pink-500/20'}`}
              />
              {vanishMode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Ghost className="w-4 h-4 text-pink-500 animate-pulse" />
                </div>
              )}
            </div>
            {newMessage.trim() === '' ? (
              <Button variant="ghost" size="icon" className="shrink-0 w-10 h-10 rounded-full text-gray-400 hover:text-pink-500" onClick={startRecording}>
                <Mic className="w-5 h-5" />
              </Button>
            ) : (
              <Button onClick={handleSendMessage} size="icon"
                className="shrink-0 w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full shadow-lg shadow-pink-500/20 transition-all active:scale-90">
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {showCallModal && (
        <CallModal chatId={chat.id} userId={userId} otherUser={otherUser} callType={callType} isIncoming={false} onClose={() => setShowCallModal(false)} />
      )}

      <CreatePollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreated={async (question, options, allowMultiple) => {
          const { data, error } = await createPoll({
            chat_id: chat.id,
            creator_id: userId,
            question,
            multiple_choice: allowMultiple,
            options
          });
          if (data && !error) {
            setMessages((prev: Message[]) => [...prev, data as Message]);
          }
        }}
      />
    </div>
  );
}

function LinkPreview({ url }: { url: string }) {
  try {
    const domain = new URL(url).hostname;
    return (
      <div className="bg-black/5 dark:bg-white/5 rounded-lg p-2 mb-1 border-l-4 border-pink-500 cursor-pointer" onClick={() => window.open(url, '_blank')}>
        <div className="flex items-center gap-2 mb-1">
          <ExternalLink className="w-3 h-3 text-pink-500" />
          <span className="text-[10px] font-bold text-pink-500 uppercase tracking-tighter">{domain}</span>
        </div>
        <p className="text-[11px] font-medium line-clamp-1 opacity-80">{url}</p>
      </div>
    );
  } catch (e) {
    return null;
  }
}


