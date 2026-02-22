import { Sparkles, Brain, MessageSquareHeart, Zap, Quote } from 'lucide-react';

export function AISection() {
    return (
        <section className="py-16 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-950">
            {/* Decorative Orbs */}
            <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>

            <div className="container max-w-6xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-purple-600 dark:text-purple-400 text-xs font-bold mb-4 luxury-shadow uppercase tracking-widest">
                        <Sparkles className="w-5 h-5 animate-spin-slow" />
                        <span>Kecerdasan Estetis</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white leading-tight">
                        Dialog Yang Lebih <br />
                        <span className="gradient-text">Hidup & Penuh Rasa.</span>
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        AI LoveChat bukan sekadar algoritma; ia adalah asisten puitis yang membantu Anda mengekspresikan jutaan kata dari dalam hati.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                        {[
                            {
                                icon: <Brain className="w-7 h-7 text-blue-500" />,
                                title: "Currated Topic Suggestions",
                                desc: "AI kami menganalisis suasana obrolan dan memberikan ide segar untuk memperdalam koneksi Anda setiap hari."
                            },
                            {
                                icon: <MessageSquareHeart className="w-7 h-7 text-rose-500" />,
                                title: "Poetic Message Generation",
                                desc: "Butuh sentuhan romantis? Biarkan AI membuatkan draf pesan indah yang terasa sangat personal."
                            },
                            {
                                icon: <Zap className="w-7 h-7 text-amber-500" />,
                                title: "Infinite Knowledge",
                                desc: "Akses ke ribuan panduan komunikasi sehat dan tips kencan unik langsung dalam genggaman."
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-5 rounded-2xl glass-card luxury-shadow hover:bg-white/80 dark:hover:bg-black/40 transition-all group">
                                <div className="shrink-0 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-400 rounded-[4rem] opacity-30 blur-2xl animate-pulse"></div>
                        <div className="bg-gray-950 rounded-[3.5rem] p-1 shadow-2xl overflow-hidden border border-white/10 luxury-shadow">
                            <div className="bg-gray-900 rounded-[3.4rem] p-8 md:p-14 h-full flex flex-col justify-center relative">
                                <div className="absolute top-0 right-0 p-8 opacity-20">
                                    <Sparkles className="w-32 h-32 text-purple-500 rotate-12" />
                                </div>

                                <div className="space-y-8 relative z-10">
                                    <div className="flex gap-4 animate-fade-in-down">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shrink-0 shadow-lg luxury-shadow"></div>
                                        <div className="glass-card p-5 rounded-3xl rounded-tl-none text-white text-md shadow-2xl">
                                            "Bagaimana cara bilang aku sangat rindu hari ini?"
                                        </div>
                                    </div>

                                    <div className="flex flex-row-reverse gap-4 animate-fade-in animation-delay-1000">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shrink-0 flex items-center justify-center shadow-lg luxury-shadow">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-3xl rounded-tr-none text-white text-md shadow-2xl relative">
                                            <Quote className="absolute -top-3 -left-3 w-8 h-8 text-white/20" />
                                            "Coba ini: 'Jarak mungkin terasa menyiksaku hari ini, tapi bayanganmu adalah tempat ternyaman untukku beristirahat.'"
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t border-white/5 flex items-center justify-between text-gray-400 text-sm font-bold uppercase tracking-widest">
                                        <span>Aura AI is typing...</span>
                                        <div className="flex gap-2">
                                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce"></div>
                                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce animation-delay-200"></div>
                                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-bounce animation-delay-400"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
