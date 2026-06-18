import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface HeroProps {
    onStartChat: () => void;
}

export function Hero({ onStartChat }: HeroProps) {
    return (
        <section className="relative h-dvh flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950 px-4">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1543807535-eceef0bc6599?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                    alt="Luxury romantic mood"
                    className="w-full h-full object-cover opacity-10 dark:opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white dark:from-gray-950 dark:via-gray-950/80 dark:to-gray-950"></div>
            </div>

            <div className="container relative z-10 max-w-4xl mx-auto text-center px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-rose-600 dark:text-rose-400 text-[10px] font-bold mb-6 animate-fade-in-down luxury-shadow uppercase tracking-[0.2em]">
                    <Heart className="w-3 h-3 fill-rose-500 animate-pulse" />
                    <span>Simphony Cinta Digital</span>
                </div>

                <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 animate-fade-in leading-[0.9]">
                    <span className="block text-gray-900 dark:text-white">Ruang Pribadi</span>
                    <span className="block gradient-text pb-2">Penuh Keajaiban</span>
                </h1>

                <p className="text-sm md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto animate-fade-in animation-delay-500 leading-relaxed font-medium">
                    Didesain secara artistik untuk mempertemukan hati lewat enkripsi tercanggih dan asisten AI yang menawan.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animation-delay-700">
                    <Button
                        size="lg"
                        onClick={onStartChat}
                        className="w-full sm:w-auto text-sm h-14 px-10 bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 rounded-2xl shadow-xl shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 font-bold uppercase tracking-widest"
                    >
                        Mulai Sekarang
                    </Button>
                    <a href="#features" className="w-full sm:w-auto">
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto text-sm h-14 px-10 rounded-2xl border-rose-200 dark:border-rose-900 glass-card transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300"
                        >
                            Jelajahi Fitur
                        </Button>
                    </a>
                </div>
            </div>
        </section>
    );
}
