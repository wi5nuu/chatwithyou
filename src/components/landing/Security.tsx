import { ShieldCheck, Lock, EyeOff, Key } from 'lucide-react';

export function Security() {
    return (
        <section id="security" className="py-16 relative overflow-hidden bg-white dark:bg-gray-950">
            <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>

            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-blue-600 dark:text-blue-400 text-xs font-bold mb-6 luxury-shadow uppercase tracking-widest">
                            <Lock className="w-4 h-4" />
                            <span>Privasi Absolut</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black mb-5 text-gray-900 dark:text-white leading-tight">
                            Benteng Keamanan <br />
                            <span className="gradient-text">Hanya Untuk Anda.</span>
                        </h2>
                        <p className="text-muted-foreground text-sm md:text-base mb-8 leading-relaxed">
                            Kami membangun LoveChat di atas fondasi kepercayaan. Setiap bit data Anda dilindungi oleh enkripsi kriptografi tingkat militer.
                        </p>

                        <div className="space-y-4">
                            {[
                                {
                                    icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
                                    title: "End-to-End Encryption",
                                    desc: "Kunci dekripsi hanya ada di perangkat Anda dan pasangan. Data aman dari penyadapan pihak mana pun."
                                },
                                {
                                    icon: <EyeOff className="w-6 h-6 text-purple-500" />,
                                    title: "Zero-Knowledge Architecture",
                                    desc: "Kami tidak memiliki akses ke pesan Anda. Bahkan engineer kami pun tidak dapat membacanya."
                                },
                                {
                                    icon: <Key className="w-6 h-6 text-amber-500" />,
                                    title: "Kunci Pribadi Lokal",
                                    desc: "Kunci enkripsi hanya tersimpan di perangkat Anda, bukan di server kami."
                                }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl glass-card luxury-shadow hover:bg-white/90 dark:hover:bg-black/60 transition-all">
                                    <div className="mt-0.5 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-inner shrink-0">{item.icon}</div>
                                    <div>
                                        <h4 className="font-bold text-base text-gray-900 dark:text-white mb-1">{item.title}</h4>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <div className="relative group">
                            <div className="absolute -inset-6 bg-blue-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-full aspect-square glass-card rounded-[3rem] flex items-center justify-center p-10 relative overflow-hidden luxury-shadow border-[8px] border-white dark:border-gray-800">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5"></div>

                                <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl relative z-10 animate-float border border-white/20">
                                    <div className="relative">
                                        <ShieldCheck className="w-24 h-24 text-blue-500 mx-auto" />
                                        <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20"></div>
                                    </div>
                                </div>

                                <div className="absolute top-12 right-12 glass-card p-4 rounded-2xl luxury-shadow animate-bounce-slow">
                                    <Lock className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="absolute bottom-12 left-12 glass-card p-4 rounded-2xl luxury-shadow animate-pulse">
                                    <Key className="w-6 h-6 text-amber-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
