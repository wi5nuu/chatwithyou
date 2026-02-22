import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { AIChat } from '@/components/chat/AIChat';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { LandingPage } from '@/components/landing/LandingPage';
import { getCurrentUser, supabase, getProfile } from '@/lib/supabase';
import { useOnlineStatus } from '@/hooks/useRealtime';
import type { Chat, Profile } from '@/types';
import { Heart } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showLanding, setShowLanding] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
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

  useOnlineStatus(user?.id);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadUserProfile(currentUser.id);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (uid: string) => {
    const { data } = await getProfile(uid);
    if (data) setProfile(data as Profile);
  };

  const handleAuthSuccess = async () => {
    await checkAuth();
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setShowAIChat(false);
    setShowProfile(false);
  };

  const handleOpenAIChat = () => {
    setShowAIChat(true);
    setSelectedChat(null);
    setShowProfile(false);
  };

  const handleOpenProfile = () => {
    setShowProfile(true);
    setSelectedChat(null);
    setShowAIChat(false);
  };

  const handleBack = () => {
    setSelectedChat(null);
    setShowAIChat(false);
    setShowProfile(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return <LandingPage onStartChat={() => setShowLanding(false)} />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-4 relative overflow-hidden">
        <div className="absolute top-0 -left-10 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-0 -right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
                LoveChat
              </span>
            </div>
          </div>
          <div className="glass-card p-10 rounded-[3rem] luxury-shadow border-white/20">
            <Button
              variant="ghost"
              onClick={() => setShowLanding(true)}
              className="mb-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold"
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

  const showSidebar = !isMobile || (!selectedChat && !showAIChat && !showProfile);
  const showMain = !isMobile || selectedChat || showAIChat || showProfile;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Chat List */}
      {showSidebar && (
        <div className={`${isMobile ? 'w-full' : 'w-80'} h-full shrink-0`}>
          <ChatList
            userId={user.id}
            userEmail={user.email}
            userAvatar={profile?.avatar_url}
            userDisplayName={profile?.display_name}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(d => !d)}
            onOpenAIChat={handleOpenAIChat}
            onOpenProfile={handleOpenProfile}
          />
        </div>
      )}

      {/* Main Panel */}
      {showMain && (
        <div className={`${isMobile ? 'w-full animate-slide-in' : 'flex-1'} h-full overflow-hidden relative`}>
          {showProfile && (
            <ProfilePage
              userId={user.id}
              userEmail={user.email}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(d => !d)}
              onBack={handleBack}
              onSignOut={() => { setUser(null); setProfile(null); }}
              onProfileUpdated={() => loadUserProfile(user.id)}
            />
          )}
          {selectedChat && !showProfile && (
            <ChatRoom
              chat={selectedChat}
              userId={user.id}
              userEmail={user.email}
              onBack={handleBack}
              isMobile={isMobile}
            />
          )}
          {showAIChat && !showProfile && (
            <AIChat
              userId={user.id}
              userEmail={user.email}
              onBack={handleBack}
              isMobile={isMobile}
            />
          )}
          {!isMobile && !selectedChat && !showAIChat && !showProfile && (
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
          )}
        </div>
      )}
    </div>
  );
}

export default App;
