import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { AIChat } from '@/components/chat/AIChat';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { LandingPage } from '@/components/landing/LandingPage';
import { CallModal } from '@/components/call/CallModal';
import { GamesPage } from '@/components/games/GamesPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { MovieRoom } from '@/components/chat/MovieRoom';
import { getCurrentUser, supabase, getProfile, getUserChats } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useRealtime';
import { useGlobalMessageNotifications, useGlobalCallNotifications } from '@/hooks/useNotifications';
import { useTabNotification } from '@/hooks/useTabNotification';
import type { Chat, Profile } from '@/types';
import { Heart } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showLanding, setShowLanding] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callerProfile, setCallerProfile] = useState<Profile | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [totalUnread, setTotalUnread] = useState(0);

  // Remotely managed online status - keep only one call
  useOnlineStatus(user?.id || null);
  useGlobalMessageNotifications(user?.id || null, selectedChat?.id || null);
  useGlobalCallNotifications(user?.id || null);
  useTabNotification(totalUnread);

  // Load total stats
  useEffect(() => {
    if (!user?.id) return;
    const loadStats = async () => {
      const { data } = await getUserChats(user.id);
      if (data) {
        const total = data.reduce((acc: number, item: any) => {
          const chat = (item as any).chats;
          const unread = chat.messages?.filter((m: any) => m.sender_id !== user.id && !m.is_read).length || 0;
          return acc + unread;
        }, 0);
        setTotalUnread(total);
      }
    };
    loadStats();

    const channel = supabase.channel('global-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    const saved = localStorage.getItem('lovechat_darkmode');
    if (saved) setDarkMode(saved === 'true');
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('lovechat_darkmode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('resize', handle);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen for incoming calls
    const channel = supabase
      .channel(`global-calls:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
        },
        async (payload) => {
          const call = payload.new;
          if (call.caller_id !== user.id && call.status === 'ringing') {
            // Check if user is a participant in this chat
            const { data: participants } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', call.chat_id);

            if (participants?.some(p => p.user_id === user.id)) {
              // Get caller profile
              const { data: profileData } = await getProfile(call.caller_id);
              if (profileData) {
                setCallerProfile(profileData as Profile);
                setActiveCall(call);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadUserProfile(currentUser.id);
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      toast.error('Gagal memverifikasi sesi. Silakan masuk kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (uid: string) => {
    const { data } = await getProfile(uid);
    if (data) setProfile(data as Profile);
  };

  // Persist selected chat on refresh
  useEffect(() => {
    const chatPathMatch = location.pathname.match(/\/chat\/([^\/]+)/);
    const moviePathMatch = location.pathname.match(/\/movie\/([^\/]+)/);
    const chatId = chatPathMatch?.[1] || moviePathMatch?.[1];

    if (chatId && user && (!selectedChat || selectedChat.id !== chatId)) {
      const loadChat = async () => {
        const { data } = await getUserChats(user.id);
        if (data) {
          const chatItem = data.find((item: any) => item.chat_id === chatId);
          if (chatItem) {
            const chatObj = (chatItem as any).chats;
            setSelectedChat({
              id: chatObj.id,
              created_at: chatObj.created_at,
              reset_at: chatObj.reset_at,
              is_group: chatObj.is_group,
              name: chatObj.name,
              avatar_url: chatObj.avatar_url,
              wallpaper_url: chatObj.wallpaper_url,
              wallpaper_color: chatObj.wallpaper_color,
              participants: chatObj.participants,
            } as Chat);
          }
        }
      };
      loadChat();
    }
  }, [location.pathname, user, selectedChat]);

  const handleAuthSuccess = async () => {
    await checkAuth();
  };

  const handleOpenGames = (chatId?: string) => {
    navigate('/games');
    if (chatId) console.log('Opening games for partner chat:', chatId);
  };

  useEffect(() => {
    const handleOpenFromChat = (e: any) => {
      handleOpenGames(e.detail.chatId);
    };
    window.addEventListener('open-games', handleOpenFromChat);
    return () => window.removeEventListener('open-games', handleOpenFromChat);
  }, []);

  const handleOpenMovieRoom = (chatId?: string) => {
    if (chatId) navigate(`/movie/${chatId}`);
    else navigate('/movie/general');
  };

  useEffect(() => {
    const handleOpenFromChat = (e: any) => {
      handleOpenMovieRoom(e.detail.chatId);
    };
    window.addEventListener('open-movie', handleOpenFromChat);
    return () => window.removeEventListener('open-movie', handleOpenFromChat);
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-pink-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce-slow mb-8">
            <Heart className="w-10 h-10 text-white fill-white/20" />
          </div>
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-black bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
              LoveChat
            </h2>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }} />
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }} />
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40 mt-4">
              Securing your connections
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return <LandingPage onStartChat={() => setShowLanding(false)} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4 py-8 relative overflow-x-hidden">
        <div className="absolute top-0 -left-10 w-72 sm:w-96 h-72 sm:h-96 bg-rose-500/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-0 -right-10 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
                LoveChat
              </span>
            </div>
          </div>
          <div className="glass-card p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] luxury-shadow border-white/20">
            <Button
              variant="ghost"
              onClick={() => setShowLanding(true)}
              className="mb-5 sm:mb-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold"
            >
              ← Kembali ke Beranda
            </Button>
            {authMode === 'login' ? (
              <LoginForm onSuccess={handleAuthSuccess} onToggleMode={() => setAuthMode('signup')} />
            ) : (
              <SignupForm onSuccess={handleAuthSuccess} onToggleMode={() => setAuthMode('login')} />
            )}
          </div>
          <p className="text-center text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
            Secured by LoveChat Encryption
          </p>
        </div>
      </div>
    );
  }

  const isMainPath = location.pathname === '/';
  const showSidebar = !isMobile || isMainPath;
  const showMain = !isMobile || !isMainPath;

  return (
    <main className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Chat List */}
      {showSidebar && (
        <div className={`${isMobile ? 'w-full' : 'w-80'} h-full shrink-0`}>
          <ChatList
            userId={user.id}
            userEmail={user.email}
            userAvatar={profile?.avatar_url}
            userDisplayName={profile?.display_name}
            selectedChat={selectedChat}
            onSelectChat={(chat) => {
              setSelectedChat(chat);
              navigate(`/chat/${chat.id}`);
            }}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(d => !d)}
            onOpenAIChat={() => navigate('/ai-chat')}
            onOpenProfile={() => navigate('/profile')}
            onOpenGames={() => navigate('/games')}
            onOpenSettings={() => navigate('/settings')}
          />
        </div>
      )}

      {/* Main Panel */}
      {showMain && (
        <div className={`${isMobile ? 'w-full animate-slide-in' : 'flex-1'} h-full overflow-hidden relative`}>
          <Routes>
            <Route path="/profile" element={
              <ProfilePage
                userId={user.id}
                userEmail={user.email}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(d => !d)}
                onBack={() => navigate('/')}
                onSignOut={() => {
                  setUser(null);
                  setProfile(null);
                  navigate('/');
                }}
                onProfileUpdated={() => loadUserProfile(user.id)}
              />
            } />

            <Route path="/games" element={
              <GamesPage
                userId={user.id}
                onBack={() => navigate('/')}
              />
            } />

            <Route path="/settings" element={
              <SettingsPage
                userId={user.id}
                userEmail={user.email}
                onBack={() => navigate('/')}
                deferredPrompt={deferredPrompt}
              />
            } />

            <Route path="/chat/:id" element={
              selectedChat ? (
                <ChatRoom
                  chat={selectedChat}
                  userId={user.id}
                  userEmail={user.email}
                  onBack={() => navigate('/')}
                  isMobile={isMobile}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-6 text-center">
                  <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-bold text-gray-500">Memuat Chat...</p>
                </div>
              )
            } />

            <Route path="/movie/:id" element={
              selectedChat ? (
                <MovieRoom
                  chat={selectedChat}
                  userId={user.id}
                  onBack={() => navigate(`/chat/${selectedChat.id}`)}
                />
              ) : <div className="h-full flex items-center justify-center">Pilih chat terlebih dahulu untuk nonton bareng</div>
            } />

            <Route path="/ai-chat" element={
              <AIChat
                userId={user.id}
                userEmail={user.email}
                onBack={() => navigate('/')}
              />
            } />

            <Route path="/" element={
              !isMobile ? (
                <div className="flex-1 h-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">LoveChat</h2>
                    <p className="text-muted-foreground max-w-sm mb-6">Pilih chat dari daftar atau mulai chat baru untuk mengobrol.</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Terenkripsi end-to-end</span>
                    </div>
                  </div>
                </div>
              ) : null
            } />
            <Route path="*" element={<RouteSynchronizer setSelectedChat={setSelectedChat} navigate={navigate} />} />
          </Routes>
        </div>
      )}
      {/* Global Call Overlay */}
      {activeCall && callerProfile && (
        <CallModal
          chatId={activeCall.chat_id}
          userId={user!.id}
          isIncoming={true}
          incomingCall={activeCall}
          otherUser={callerProfile}
          callType={activeCall.type}
          onClose={() => {
            setActiveCall(null);
            setCallerProfile(null);
          }}
        />
      )}
      <Toaster position="top-center" richColors />
    </main>
  );
}

// Helper component to synchronize routing state
function RouteSynchronizer({ setSelectedChat, navigate }: { setSelectedChat: (c: Chat | null) => void, navigate: any }) {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') {
      setSelectedChat(null);
    } else if (!location.pathname.startsWith('/chat/') && !location.pathname.startsWith('/settings') && !location.pathname.startsWith('/movie') && !location.pathname.startsWith('/games') && !location.pathname.startsWith('/profile')) {
      navigate('/');
    }
  }, [location.pathname, setSelectedChat, navigate]);

  return <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Pilih chat untuk memulai</div>;
}

export default App;
