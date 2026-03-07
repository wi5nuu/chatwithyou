import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Heart,
    ChevronLeft,
    Trophy,
    Gamepad2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LoveQuizProps {
    chatId: string;
    onComplete: (levelUp: boolean) => void;
    onBack: () => void;
}

const QUESTIONS = [
    { q: 'Siapa yang duluan lapar di pagi hari?', options: ['Aku', 'Dia', 'Dua-duanya'] },
    { q: 'Apa warna kesukaan pasanganmu?', options: ['Merah/Pink', 'Biru/Hijau', 'Hitam/Putih'] },
    { q: 'Siapa yang lebih manja kalau lagi capek?', options: ['Aku', 'Dia', 'Dua-duanya'] },
    { q: 'Apa jenis kencan favorit kalian?', options: ['Nonton/Game', 'Makan Mewah', 'Jalan-jalan Santai'] },
    { q: 'Siapa yang paling sering lupa naruh barang?', options: ['Aku', 'Dia', 'Dua-duanya'] }
];

export function LoveQuiz({ chatId, onComplete, onBack }: LoveQuizProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [isFinished, setIsFinished] = useState(false);

    const handleAnswer = (index: number) => {
        const newAnswers = [...answers, index];
        setAnswers(newAnswers);

        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setIsFinished(true);
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        try {
            // Logic: Setiap kuis selesai bakal nambah level kalau belum mentok 19
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
            console.error('Error finishing quiz:', e);
            onComplete(false);
        }
    };

    if (isFinished) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce-slow">
                    <Trophy className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Misi Selesai!</h2>
                    <p className="text-lg font-bold text-rose-500 italic">"Wah kalian pasangan yang hebat dan lucu!"</p>
                    <p className="text-sm text-muted-foreground">Hubungan kalian naik satu tingkat lebih tinggi. ✨</p>
                </div>
                <Button
                    onClick={onBack}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl px-10 py-6 font-bold shadow-lg shadow-rose-500/20"
                >
                    Kembali ke Dashboard
                </Button>
            </div>
        );
    }

    const question = QUESTIONS[currentStep];
    const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-950">
            <div className="p-4 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">Kuis Cinta</h1>
                    <Progress value={progress} className="h-1.5 mt-1" />
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {currentStep + 1} / {QUESTIONS.length}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
                <div className="relative">
                    <div className="absolute -top-10 -left-10 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-700" />
                    <Heart className="w-16 h-16 text-rose-500 fill-rose-500 animate-pulse-slow" />
                </div>

                <div className="w-full max-w-md space-y-10">
                    <h2 className="text-2xl sm:text-3xl font-black text-center text-gray-800 dark:text-white leading-tight">
                        {question.q}
                    </h2>

                    <div className="grid grid-cols-1 gap-4 w-full">
                        {question.options.map((option, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(i)}
                                className="group relative w-full glass-card p-6 rounded-[1.5rem] border-2 border-transparent hover:border-rose-500 transition-all duration-300 text-left active:scale-[0.98] luxury-shadow overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-rose-500/10 transition-colors" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-800 flex items-center justify-center group-hover:border-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all text-xs font-black">
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-rose-500 transition-colors">{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8 text-center opacity-20 select-none">
                <Gamepad2 className="w-6 h-6 mx-auto mb-2" />
                <p className="text-[8px] font-bold uppercase tracking-[0.4em]">LoveChat Interactive Sessions</p>
            </div>
        </div>
    );
}
