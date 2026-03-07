import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    Flame,
    Zap,
    RotateCcw,
    ShieldCheck,
    Swords,
    Gamepad2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TruthOrDareProps {
    chatId: string;
    onComplete: (levelUp: boolean) => void;
    onBack: () => void;
}

const TRUTHS = [
    "Apa hal pertama yang membuatmu tertarik padaku?",
    "Apa kebiasaan burukku yang paling lucu menurutmu?",
    "Kalau kita bisa pergi ke mana saja sekarang, kamu mau ke mana?",
    "Apa mimpi tergilamu tentang masa depan kita?",
    "Sebutkan satu hal yang belum pernah kamu ceritakan ke siapa pun."
];

const DARES = [
    "Katakan 'I Love You' dengan suara paling kencang!",
    "Nyanyikan lagu romantis favoritmu selama 30 detik.",
    "Beri aku gombalan maut paling kreatif yang kamu punya.",
    "Posting foto kita di status WhatsApp sekarang juga!",
    "Tarik napas dalam-dan dan bilang 'Aku beruntung memilikimu' 5 kali."
];

export function TruthOrDare({ chatId, onComplete, onBack }: TruthOrDareProps) {
    const [mode, setMode] = useState<'selection' | 'display' | 'finished'>('selection');
    const [type, setType] = useState<'truth' | 'dare' | null>(null);
    const [content, setContent] = useState('');
    const [completedCount, setCompletedCount] = useState(0);

    const handleSelect = (selectedType: 'truth' | 'dare') => {
        const pool = selectedType === 'truth' ? TRUTHS : DARES;
        const randomContent = pool[Math.floor(Math.random() * pool.length)];
        setType(selectedType);
        setContent(randomContent);
        setMode('display');
    };

    const handleDone = async () => {
        if (completedCount < 2) {
            setCompletedCount(prev => prev + 1);
            setMode('selection');
        } else {
            setMode('finished');
            await finishGame();
        }
    };

    const finishGame = async () => {
        try {
            const { data: chat } = await supabase
                .from('chats')
                .select('game_level')
                .eq('id', chatId)
                .single();

            const currentLevel = chat?.game_level || 1;
            if (currentLevel < 19) {
                const { error } = await supabase
                    .from('chats')
                    .update({ game_level: currentLevel + 1 })
                    .eq('id', chatId);

                if (!error) {
                    onComplete(true);
                    return;
                }
            }
            onComplete(false);
        } catch (e) {
            console.error('Error finishing Truth or Dare:', e);
            onComplete(false);
        }
    };

    if (mode === 'finished') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                    <Swords className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Tantangan Selesai!</h2>
                    <p className="text-lg font-bold text-orange-500 italic">"Gokil! Kalian berdua emang pasangan paling berani!"</p>
                    <p className="text-sm text-muted-foreground font-medium">Level hubungan kalian makin panas! 🔥</p>
                </div>
                <Button
                    onClick={onBack}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl px-10 py-6 font-bold shadow-lg shadow-orange-500/20"
                >
                    Kembali ke Pusat Game
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-orange-50/30 dark:bg-gray-950">
            <div className="p-4 flex items-center gap-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">Truth or Dare</h1>
                </div>
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < completedCount ? 'bg-orange-500 shadow-sm' : 'bg-gray-200 dark:bg-gray-800'}`} />
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-10 max-w-md mx-auto w-full">
                {mode === 'selection' ? (
                    <>
                        <div className="text-center space-y-2">
                            <Zap className="w-12 h-12 text-orange-500 mx-auto animate-pulse" />
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Pilih Nasibmu!</h2>
                            <p className="text-sm text-muted-foreground font-medium">Berani jujur atau berani tantangan?</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 w-full">
                            <button
                                onClick={() => handleSelect('truth')}
                                className="group relative glass-card p-8 rounded-[2rem] border-2 border-transparent hover:border-blue-500 transition-all duration-300 text-center active:scale-[0.98] luxury-shadow overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                                <ShieldCheck className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                                <span className="block font-black text-2xl text-blue-600 uppercase tracking-tight">TRUTH</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Berani Jujur</span>
                            </button>

                            <button
                                onClick={() => handleSelect('dare')}
                                className="group relative glass-card p-8 rounded-[2rem] border-2 border-transparent hover:border-red-500 transition-all duration-300 text-center active:scale-[0.98] luxury-shadow overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                                <Flame className="w-10 h-10 text-red-500 mx-auto mb-3" />
                                <span className="block font-black text-2xl text-red-600 uppercase tracking-tight">DARE</span>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Berani Tantangan</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full space-y-8 animate-in slide-in-from-bottom-10 duration-500">
                        <div className={`p-8 rounded-[2.5rem] text-center space-y-6 luxury-shadow border-4 ${type === 'truth' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${type === 'truth' ? 'bg-blue-500' : 'bg-red-500'} text-white shadow-lg`}>
                                {type === 'truth' ? <ShieldCheck className="w-8 h-8" /> : <Flame className="w-8 h-8" />}
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 dark:text-white leading-tight italic">
                                "{content}"
                            </h3>
                        </div>

                        <Button
                            onClick={handleDone}
                            className={`w-full ${type === 'truth' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-[1.5rem] py-8 font-black text-lg shadow-xl shadow-orange-500/20`}
                        >
                            SAYA SUDAH LAKUKAN!
                        </Button>

                        <button
                            onClick={() => setMode('selection')}
                            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-orange-500 transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" /> Ganti Pilihan
                        </button>
                    </div>
                )}
            </div>

            <div className="p-8 text-center opacity-20 select-none">
                <Gamepad2 className="w-6 h-6 mx-auto mb-2" />
                <p className="text-[8px] font-bold uppercase tracking-[0.4em]">Bonding through play</p>
            </div>
        </div>
    );
}
