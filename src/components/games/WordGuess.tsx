import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Heart,
    ChevronLeft,
    Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface WordGuessProps {
    chatId: string;
    onComplete: (levelUp: boolean) => void;
    onBack: () => void;
}

const WORDS = [
    { word: 'SAYANG', hint: 'Panggilan paling umum buat pasangan.' },
    { word: 'CINTA', hint: 'Perasaan yang paling kuat di dunia.' },
    { word: 'RINDU', hint: 'Rasanya pgn ketemu terus.' },
    { word: 'JANJI', hint: 'Harus ditepati, jangan diingkari.' },
    { word: 'PELUK', hint: 'Hangat dan bikin tenang.' },
    { word: 'MANJA', hint: 'Sikap kalau lagi pgn diperhatiin.' },
    { word: 'SETIA', hint: 'Cuma satu buat selamanya.' }
];

export function WordGuess({ chatId, onComplete, onBack }: WordGuessProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [guess, setGuess] = useState('');
    const [solvedCount, setSolvedCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    const activeWord = WORDS[currentWordIndex];

    const handleGuess = () => {
        if (guess.toUpperCase().trim() === activeWord.word) {
            toast.success('Yeay! Jawaban kamu benar! ✨');
            setGuess('');

            if (solvedCount < 2) {
                setSolvedCount(solvedCount + 1);
                setCurrentWordIndex((currentWordIndex + 1) % WORDS.length);
            } else {
                setIsFinished(true);
                finishGame();
            }
        } else {
            toast.error('Yah, salah.. Coba lagi ya! 💪');
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
            console.error('Error finishing word guess:', e);
            onComplete(false);
        }
    };

    if (isFinished) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                    <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Pasangan Cerdas!</h2>
                    <p className="text-lg font-bold text-indigo-500 italic">"Kalian kompak banget menebak kata-kata cinta!"</p>
                    <p className="text-sm text-muted-foreground font-medium">Naik satu level lagi nih! 🚀</p>
                </div>
                <Button
                    onClick={onBack}
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl px-10 py-6 font-bold shadow-lg shadow-indigo-500/20"
                >
                    Lanjut Koleksi Level
                </Button>
            </div>
        );
    }


    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-gray-950">
            <div className="p-4 flex items-center gap-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">Tebak Kata</h1>
                </div>
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < solvedCount ? 'bg-indigo-500 shadow-sm' : 'bg-gray-200 dark:bg-gray-800'}`} />
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-10 max-w-md mx-auto w-full">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                        <Sparkles className="w-4 h-4" /> Petunjuk
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white leading-tight italic">
                        "{activeWord.hint}"
                    </h2>
                </div>

                <div className="flex gap-2 justify-center w-full">
                    {activeWord.word.split('').map((_, i) => (
                        <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-b-4 border-indigo-500 font-black text-xl sm:text-2xl text-indigo-600 bg-white dark:bg-gray-900 rounded-t-xl luxury-shadow shadow-indigo-100/50">
                            {guess.length > i ? guess[i].toUpperCase() : ''}
                        </div>
                    ))}
                </div>

                <div className="w-full space-y-4 pt-10">
                    <Input
                        autoFocus
                        placeholder="Ketik jawabanmu..."
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                        className="rounded-[1.5rem] py-8 text-center text-xl font-black uppercase tracking-widest border-2 focus-visible:ring-indigo-500 border-indigo-100 dark:border-gray-800 luxury-shadow"
                    />
                    <Button
                        onClick={handleGuess}
                        className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-[1.5rem] py-8 font-black text-lg shadow-xl shadow-indigo-500/20"
                    >
                        TEBAK SEKARANG!
                    </Button>
                </div>
            </div>

            <div className="p-8 text-center opacity-20 select-none">
                <Heart className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                <p className="text-[8px] font-bold uppercase tracking-[0.4em]">Bonding through play</p>
            </div>
        </div>
    );
}
