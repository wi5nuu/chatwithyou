import { Button } from '@/components/ui/button';
import { Heart, Instagram, Twitter, Mail } from 'lucide-react';

interface FooterProps {
    onStartChat: () => void;
}

export function Footer({ onStartChat }: FooterProps) {
    return (
        <section className="h-dvh relative overflow-hidden bg-white dark:bg-gray-950 flex items-center justify-center border-t border-gray-100 dark:border-gray-900">
            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="relative group mb-12">
                    <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 rounded-[4rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative bg-gray-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-5xl font-black mb-4 leading-tight">Siap Untuk <br /><span className="text-rose-500">Mencintai Lebih Dalam?</span></h2>
                            <Button
                                size="lg"
                                onClick={onStartChat}
                                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white text-md h-12 px-8 rounded-full font-black shadow-2xl transition-all hover:scale-105 active:scale-95 luxury-shadow"
                            >
                                DAFTAR GRATIS SEKARANG
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 px-4">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <Heart className="w-4 h-4 text-white animate-pulse" />
                            </div>
                            <span className="text-lg font-black bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
                                LoveChat
                            </span>
                        </div>
                        <p className="text-muted-foreground text-[10px] leading-relaxed italic">
                            "Keahlian dalam menjaga rahasia hati."
                        </p>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="font-black text-gray-900 dark:text-white mb-4 uppercase tracking-widest text-[10px]">Produk</h4>
                        <ul className="space-y-2 text-muted-foreground font-bold text-[10px]">
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Enkripsi End-to-End</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">AI Assistant</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Video Call 8K</li>
                        </ul>
                    </div>

                    <div className="hidden md:block">
                        <h4 className="font-black text-gray-900 dark:text-white mb-4 uppercase tracking-widest text-[10px]">Eksplorasi</h4>
                        <ul className="space-y-2 text-muted-foreground font-bold text-[10px]">
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Filosofi Kami</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Panduan Keamanan</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Bantuan</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-gray-900 dark:text-white mb-4 uppercase tracking-widest text-[10px]">Koneksi</h4>
                        <div className="flex gap-3">
                            {[Instagram, Twitter, Mail].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-rose-500 hover:text-white transition-all luxury-shadow border-white/40">
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">© 2024 LOVECHAT ARCHIVE. SECURED BY ENCRYPTION PROTOCOLS.</p>
                    <div className="flex gap-6 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        <a href="#" className="hover:text-rose-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-rose-500 transition-colors">Terms Of Elegance</a>
                    </div>
                </div>
            </div>
        </section>
    );
}
