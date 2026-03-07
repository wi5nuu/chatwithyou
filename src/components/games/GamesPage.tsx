import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Card } from '@/components/ui/card';
import {
    Heart,
    Trophy,
    ChevronLeft,
    Star,
    MessageSquare,
    Download,
    Flame,
    Zap
} from 'lucide-react';
import { supabase, getFriends } from '@/lib/supabase';
import type { Chat } from '@/types';
import { toast } from 'sonner';
import { LoveQuiz } from './LoveQuiz';
import { WordGuess } from './WordGuess';
import { TruthOrDare } from './TruthOrDare';
import { CertificateGenerator } from './CertificateGenerator';

interface GamesPageProps {
    userId: string;
    onBack: () => void;
}

interface Game {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    minLevel: number;
    type: 'quiz' | 'word' | 'truth-dare';
}

const GAMES: Game[] = [
    {
        id: 'love-quiz',
        title: 'Kuis Cinta',
        description: 'Seberapa kenal kamu dengan dia? Uji kecocokan kalian di sini!',
        icon: Heart,
        color: 'from-pink-500 to-rose-500',
        minLevel: 1,
        type: 'quiz'
    },
    {
        id: 'tebak-kata',
        title: 'Tebak Kata',
        description: 'Main tebak-tebakan kata romantis yang seru dan lucu.',
        icon: MessageSquare,
        color: 'from-blue-500 to-indigo-600',
        minLevel: 3,
        type: 'word'
    },
    {
        id: 'truth-dare',
        title: 'Truth or Dare',
        description: 'Makin akrab dengan tantangan dan kejujuran yang menantang.',
        icon: Flame,
        color: 'from-orange-500 to-red-600',
        minLevel: 5,
        type: 'truth-dare'
    }
];

export function GamesPage({ userId, onBack }: GamesPageProps) {
    const [activePartnerChat, setActivePartnerChat] = useState<Chat | null>(null);
    // const [chats, setChats] = useState<Chat[]>([]);
    // const [isLoading, setIsLoading] = useState(true);
    const [activeGameId, setActiveGameId] = useState<string | null>(null);
    const [showCertificate, setShowCertificate] = useState(false);

    useEffect(() => {
        loadChats();
    }, [userId]);

    const loadChats = async () => {
        try {
            // Get accepted friends first
            const { data: friendsData } = await getFriends(userId);
            const friendIds = (friendsData || []).map((f: any) =>
                f.sender_id === userId ? f.receiver_id : f.sender_id
            );

            const { data, error } = await supabase
                .from('chats')
                .select(`
          *,
          participants:chat_participants(
            user_id,
            profile:profiles(*)
          )
        `)
                .eq('is_group', false);

            if (error) throw error;

            const filtered = (data || []).filter(c => {
                const otherParticipant = c.participants.find((p: any) => p.user_id !== userId);
                return c.participants.some((p: any) => p.user_id === userId) &&
                    otherParticipant &&
                    friendIds.includes(otherParticipant.user_id);
            });

            // setChats(filtered as any);
            if (filtered.length > 0) setActivePartnerChat(filtered[0] as any);
        } catch (e) {
            console.error('Error loading chats for games:', e);
        } finally {
            // setIsLoading(false);
        }
    };

    const level = activePartnerChat?.game_level || 1;
    const progress = (level / 19) * 100;

    const handleGameComplete = (levelUp: boolean) => {
        if (levelUp) {
            toast.success('Selamat! Level hubungan kalian naik! 🎉');
            loadChats(); // Reload to get new level
        }
    };

    if (activeGameId && activePartnerChat?.participants) {

        switch (activeGameId) {
            case 'love-quiz':
                return (
                    <LoveQuiz
                        chatId={activePartnerChat.id}
                        onComplete={handleGameComplete}
                        onBack={() => setActiveGameId(null)}
                    />
                );
            case 'tebak-kata':
                return (
                    <WordGuess
                        chatId={activePartnerChat.id}
                        onComplete={handleGameComplete}
                        onBack={() => setActiveGameId(null)}
                    />
                );
            case 'truth-dare':
                return (
                    <TruthOrDare
                        chatId={activePartnerChat.id}
                        onComplete={handleGameComplete}
                        onBack={() => setActiveGameId(null)}
                    />
                );
        }
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
            <div className="p-4 flex items-center gap-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-black bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">Pusat Game</h1>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Strengthen your love bond</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800">
                    <Trophy className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">Level {level}</span>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 max-w-2xl mx-auto space-y-8">
                    {/* Level Progress */}
                    <div className="glass-card p-6 rounded-[2rem] space-y-4 luxury-shadow">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Target Akhir: Level 19</p>
                                <h2 className="text-2xl font-black text-gray-800 dark:text-white leading-tight">Progres Hubungan Kalian</h2>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-rose-500">{level}</span>
                                <span className="text-sm font-bold text-muted-foreground">/19</span>
                            </div>
                        </div>

                        <div className="relative h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-white/50 dark:border-gray-700">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 animate-shimmer"
                                style={{ width: `${progress}%`, backgroundSize: '200% 100%' }}
                            />
                            <div className="absolute top-0 left-0 h-full w-full flex items-center justify-around pointer-events-none">
                                {[...Array(5)].map((_, i) => <div key={i} className="w-0.5 h-1 bg-white/30 rounded-full" />)}
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground font-medium text-center">
                            {level === 19 ? '🎉 Selamat! Kalian adalah pasangan legendaris!' : `Butuh ${19 - level} level lagi untuk dapat Sertifikat Cinta Sejati.`}
                        </p>

                        {level === 19 && (
                            <Button
                                onClick={() => setShowCertificate(true)}
                                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-2xl py-6 font-bold shadow-lg shadow-orange-500/20 gap-2"
                            >
                                <Download className="w-5 h-5" /> Download Sertifikat Cinta
                            </Button>
                        )}
                    </div>

                    {/* Game Selection */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" /> Pilih Permainan
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            {GAMES.map((game) => {
                                const isLocked = level < game.minLevel;
                                const Icon = game.icon;

                                return (
                                    <button
                                        key={game.id}
                                        disabled={isLocked}
                                        className={`group relative text-left transition-all duration-300 active:scale-[0.98] ${isLocked ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:translate-x-1'}`}
                                        onClick={() => setActiveGameId(game.id)}
                                    >
                                        <div className={`glass-card p-5 rounded-[2rem] flex items-center gap-5 border-l-8 luxury-shadow ${!isLocked ? `border-l-${game.color.split(' ')[0].replace('from-', '')}` : 'border-l-gray-300'}`}>
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-white shadow-lg`}>
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-lg text-gray-800 dark:text-white">{game.title}</h4>
                                                    {isLocked && (
                                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[9px] font-bold text-gray-500">
                                                            <Star className="w-2.5 h-2.5" /> Lvl {game.minLevel}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate font-medium">{game.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quote Section */}
                    <div className="text-center py-10 opacity-30 select-none pointer-events-none">
                        <Heart className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 italic">"Love is a game that two can play and both win."</p>
                    </div>
                </div>
            </ScrollArea>

            {activePartnerChat?.participants && (
                <CertificateGenerator
                    open={showCertificate}
                    onOpenChange={setShowCertificate}
                    partnerName={activePartnerChat.participants.find((p: any) => p.user_id !== userId)?.profile?.display_name || 'Pasangan'}
                    userName={activePartnerChat.participants.find((p: any) => p.user_id === userId)?.profile?.display_name || 'Saya'}
                    level={level}
                />
            )}
        </div>
    );
}
