import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Play, Send, MessageSquare, Users } from 'lucide-react';
import { supabase, sendMessage } from '@/lib/supabase';
import type { Chat, Message } from '@/types';

interface MovieRoomProps {
    chat: Chat;
    userId: string;
    onBack: () => void;
}

const MOVIES = [
    {
        id: '9ItBvH5J6ss',
        title: 'The Fault In Our Stars | Official Trailer',
        thumbnail: 'https://img.youtube.com/vi/9ItBvH5J6ss/mqdefault.jpg'
    },
    {
        id: 'gox5keAGDmo',
        title: 'After Met You | FULL MOVIE',
        thumbnail: 'https://img.youtube.com/vi/gox5keAGDmo/mqdefault.jpg'
    },
    {
        id: '9XEcRmlZjA0',
        title: 'PEREMPUAN MERAH JAMBU - EPISODE 1',
        thumbnail: 'https://img.youtube.com/vi/9XEcRmlZjA0/mqdefault.jpg'
    }
];

export function MovieRoom({ chat, userId, onBack }: MovieRoomProps) {
    const [selectedMovie, setSelectedMovie] = useState(MOVIES[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTheatreMode, setIsTheatreMode] = useState(false);
    const playerRef = useRef<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        loadMessages();
        setupRealtime();
        loadYouTubeAPI();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [chat.id]);

    const loadYouTubeAPI = () => {
        if ((window as any).YT) return;
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = () => {
            createPlayer(MOVIES[0].id);
        };
    };

    const createPlayer = (videoId: string) => {
        playerRef.current = new (window as any).YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'autoplay': 0,
                'controls': 1,
                'modestbranding': 1,
                'rel': 0
            },
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
    };

    const onPlayerStateChange = (event: any) => {
        // 1 = playing, 2 = paused

        // Broadcast state change if triggered by local user interaction
        // Note: Simple debounce or flag might be needed to avoid loops
        broadcastVideoState(event.data, playerRef.current?.getCurrentTime() || 0);
    };

    const broadcastVideoState = (state: number, time: number) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'video_state',
                payload: { state, time, videoId: selectedMovie.id, userId }
            });
        }
    };

    const setupRealtime = () => {
        const channel = supabase
            .channel(`movie_sync:${chat.id}`)
            .on('broadcast', { event: 'video_state' }, ({ payload }) => {
                if (payload.userId === userId) return;

                if (payload.videoId !== selectedMovie.id) {
                    const movie = MOVIES.find(m => m.id === payload.videoId);
                    if (movie) setSelectedMovie(movie);
                }

                if (playerRef.current) {
                    // Sync time if difference is > 2 seconds
                    const diff = Math.abs(playerRef.current.getCurrentTime() - payload.time);
                    if (diff > 2) {
                        playerRef.current.seekTo(payload.time, true);
                    }

                    if (payload.state === 1 && playerRef.current.getPlayerState() !== 1) {
                        playerRef.current.playVideo();
                    } else if (payload.state === 2 && playerRef.current.getPlayerState() !== 2) {
                        playerRef.current.pauseVideo();
                    }
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` }, (payload) => {
                const msg = payload.new as Message;
                if (msg.type === 'movie_chat') {
                    setMessages(prev => [...prev, msg]);
                    scrollToBottom();
                }
            })
            .subscribe();

        channelRef.current = channel;
    };

    const loadMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .eq('type', 'movie_chat')
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setMessages(data.reverse() as Message[]);
        scrollToBottom();
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        const msg = newMessage;
        setNewMessage('');

        await sendMessage({
            chat_id: chat.id,
            sender_id: userId,
            type: 'movie_chat',
            ciphertext: btoa(msg), // Basic fallback for shared view
            iv: 'plain'
        });
    };

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const switchMovie = (movie: typeof MOVIES[0]) => {
        setSelectedMovie(movie);
        if (playerRef.current) {
            playerRef.current.loadVideoById(movie.id);
            broadcastVideoState(2, 0); // Reset to paused for others
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-white animate-in fade-in duration-500 overflow-hidden">
            {/* Sticky Header and Player */}
            <div className="sticky top-0 z-30 bg-black flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur-md border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold truncate max-w-[140px] sm:max-w-[300px]">{selectedMovie.title}</h2>
                            <div className="flex items-center gap-1.5 text-[10px] text-pink-500 font-bold uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                                Watch Together
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsTheatreMode(!isTheatreMode)}
                            className={`text-[10px] font-bold uppercase tracking-widest h-8 px-3 rounded-full border ${isTheatreMode ? 'bg-pink-600 border-pink-500 text-white' : 'border-white/10 text-white/60 hover:text-white'}`}
                        >
                            {isTheatreMode ? 'Exit Theatre' : 'Theatre Mode'}
                        </Button>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <Users className="w-3 h-3 text-pink-500" />
                            <span className="text-[10px] font-bold text-white/60">LIVE</span>
                        </div>
                    </div>
                </div>

                {/* Video Player */}
                <div className={`relative transition-all duration-500 ease-in-out bg-gray-900 w-full overflow-hidden flex items-center justify-center ${isTheatreMode ? 'aspect-video sm:aspect-[21/9] max-h-[80vh]' : 'aspect-video'}`}>
                    <div id="youtube-player" className="absolute inset-0 w-full h-full pointer-events-auto" />
                </div>
            </div>

            {/* Scrollable Content (Movies and Chat) */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!isTheatreMode && (
                    <div className="p-4 bg-gray-950 border-b border-white/5 overflow-x-auto shrink-0 scrollbar-hide">
                        <div className="flex gap-4 pb-2">
                            {MOVIES.map(movie => (
                                <button
                                    key={movie.id}
                                    onClick={() => switchMovie(movie)}
                                    className={`flex-shrink-0 w-32 group transition-all ${selectedMovie.id === movie.id ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                >
                                    <div className={`relative rounded-lg overflow-hidden border-2 transition-colors ${selectedMovie.id === movie.id ? 'border-pink-500 shadow-lg shadow-pink-500/20' : 'border-transparent'}`}>
                                        <img src={movie.thumbnail} alt={movie.title} className="w-full h-20 object-cover" />
                                        {selectedMovie.id === movie.id && (
                                            <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                                                <Play className="w-6 h-6 text-white fill-white" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold mt-2 truncate text-white/80">{movie.title}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Section */}
                <div className={`flex-1 flex flex-col min-h-0 bg-gray-900/30 transition-all duration-500 ${isTheatreMode ? 'opacity-0 h-0 invisible' : 'opacity-100 h-full'}`}>
                    <div className="p-3 bg-black/20 flex items-center gap-2 border-b border-white/5 shadow-sm">
                        <MessageSquare className="w-4 h-4 text-pink-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white/40">Movie Room Chat</span>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4 max-w-2xl mx-auto">
                            {messages.map((msg, i) => (
                                <div key={msg.id || i} className={`flex flex-col ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2 rounded-2xl text-[13px] leading-relaxed max-w-[85%] sm:max-w-md ${msg.sender_id === userId
                                        ? 'bg-gradient-to-br from-pink-600 to-rose-600 text-white rounded-tr-none shadow-lg shadow-pink-900/20'
                                        : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/10'
                                        }`}>
                                        {msg.ciphertext ? (
                                            (() => {
                                                try { return atob(msg.ciphertext); } catch { return '...'; }
                                            })()
                                        ) : '...'}
                                    </div>
                                    <span className="text-[9px] text-white/20 mt-1 font-bold">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-4 bg-black/60 border-t border-white/5 pb-safe backdrop-blur-xl">
                        <div className="flex gap-3 max-w-2xl mx-auto">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Tulis komentar seru..."
                                className="bg-white/5 border-white/10 text-white flex-1 rounded-full h-11 px-6 focus:ring-pink-500 placeholder:text-white/20"
                            />
                            <Button onClick={handleSendMessage} size="icon" className="bg-gradient-to-br from-pink-600 to-rose-600 hover:scale-105 transition-transform rounded-full h-11 w-11 shrink-0 shadow-lg shadow-pink-900/40">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
