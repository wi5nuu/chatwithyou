import { Button } from '@/components/ui/button';
import { Heart, Instagram, Twitter, Mail } from 'lucide-react';

interface FooterProps {
    onStartChat: () => void;
}

export function Footer({ onStartChat }: FooterProps) {
    return (
        <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900 pt-16 pb-10 relative overflow-hidden">
            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="relative group mb-16">
                    <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 rounded-[4rem] blur-xl opacity-30 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative bg-gray-900 rounded-3xl p-10 md:p-14 text-center text-white shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-4xl font-black mb-4 leading-tight">Siap Untuk <br /><span className="text-rose-500">Mencintai Lebih Dalam?</span></h2>
                            <p className="text-gray-400 text-sm mb-8 max-w-2xl mx-auto uppercase tracking-[0.2em] font-bold">
                                Mulailah Babak Baru Hubungan Anda Hari Ini.
                            </p>
                            <Button
                                size="lg"
                                onClick={onStartChat}
                                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:opacity-90 text-white text-lg h-14 px-10 rounded-full font-black shadow-2xl transition-all hover:scale-105 active:scale-95 luxury-shadow"
                            >
                                DAFTAR GRATIS SEKARANG
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 px-4">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center luxury-shadow shadow-rose-500/20">
                                <Heart className="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <span className="text-xl font-black bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent uppercase tracking-tighter">
                                LoveChat
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed italic">
                            "Keahlian dalam menjaga rahasia hati."
                        </p>
                    </div>

                    <div>
                        <h4 className="font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest text-sm">Produk</h4>
                        <ul className="space-y-5 text-muted-foreground font-bold">
                            <li className="hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Enkripsi End-to-End</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> AI Assistant</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Video Call 8K</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Mood Tracking</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest text-sm">Eksplorasi</h4>
                        <ul className="space-y-5 text-muted-foreground font-bold">
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Filosofi Kami</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Blog Cinta</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Panduan Keamanan</li>
                            <li className="hover:text-rose-500 transition-colors cursor-pointer">Bantuan</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-black text-gray-900 dark:text-white mb-8 uppercase tracking-widest text-sm">Koneksi</h4>
                        <div className="flex gap-5">
                            {[Instagram, Twitter, Mail].map((Icon, i) => (
                                <a key={i} href="#" className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-rose-500 hover:text-white transition-all luxury-shadow border-white/40">
                                    <Icon className="w-6 h-6" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-gray-100 dark:border-gray-900 flex flex-col md:row justify-between items-center gap-8">
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">© 2024 LOVECHAT ARCHIVE. SECURED BY ENCRYPTION PROTOCOLS.</p>
                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        <a href="#" className="hover:text-rose-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-rose-500 transition-colors">Terms Of Elegance</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
