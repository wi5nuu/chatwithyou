import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Shield, Zap } from 'lucide-react';

interface HeroProps {
    onStartChat: () => void;
}

export function Hero({ onStartChat }: HeroProps) {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950 px-4 pt-20 pb-16">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1543807535-eceef0bc6599?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                    alt="Luxury romantic mood"
                    className="w-full h-full object-cover opacity-10 dark:opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white dark:from-gray-950 dark:via-gray-950/90 dark:to-gray-950"></div>
            </div>

            {/* Decorative Blobs */}
            <div className="absolute top-0 -left-10 w-72 h-72 bg-rose-200/40 dark:bg-rose-900/10 rounded-full filter blur-3xl opacity-60 animate-blob"></div>
            <div className="absolute top-0 -right-10 w-72 h-72 bg-amber-100/40 dark:bg-amber-900/10 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>

            <div className="container relative z-10 max-w-5xl mx-auto text-center px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-rose-600 dark:text-rose-400 text-xs font-bold mb-8 animate-fade-in-down luxury-shadow">
                    <Heart className="w-4 h-4 fill-rose-500 animate-pulse" />
                    <span className="uppercase tracking-widest">Simphony Cinta Digital</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 animate-fade-in">
                    <span className="block text-gray-900 dark:text-white leading-tight">Ruang Pribadi</span>
                    <span className="block gradient-text leading-tight pb-2">Penuh Keajaiban</span>
                </h1>

                <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in animation-delay-500 leading-relaxed">
                    Didesain secara artistik untuk mempertemukan hati lewat enkripsi tercanggih dan asisten AI yang menawan.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animation-delay-700">
                    <Button
                        size="lg"
                        onClick={onStartChat}
                        className="w-full sm:w-auto text-base h-12 px-8 bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:opacity-90 rounded-full shadow-xl shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 font-bold"
                    >
                        Mulai Sekarang
                    </Button>
                    <a href="#features" className="w-full sm:w-auto">
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto text-base h-12 px-8 rounded-full border-rose-200 dark:border-rose-900 glass-card transition-all hover:bg-rose-50 dark:hover:bg-rose-900/10 font-semibold"
                        >
                            Jelajahi Fitur
                        </Button>
                    </a>
                </div>

                {/* Feature Pills */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in animation-delay-1000">
                    {[
                        { icon: <Shield className="w-5 h-5" />, label: "Privacy Absolute", sub: "End-to-end encryption" },
                        { icon: <Zap className="w-5 h-5" />, label: "Hyper Responsive", sub: "Bukan sekadar cepat" },
                        { icon: <Heart className="w-5 h-5" />, label: "Emotional AI", sub: "Mengerti perasaanmu" },
                        { icon: <MessageCircle className="w-5 h-5" />, label: "Luxury UI", sub: "Seni dalam aplikasi" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-card luxury-shadow group hover:-translate-y-1 transition-transform">
                            <div className="text-rose-500 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl group-hover:scale-110 transition-transform">{item.icon}</div>
                            <div className="text-center">
                                <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">{item.label}</span>
                                <span className="text-[10px] uppercase tracking-tight text-muted-foreground font-semibold">{item.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
