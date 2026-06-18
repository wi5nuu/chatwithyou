import { Sparkles, Brain, MessageSquareHeart, Quote } from 'lucide-react';

export function AISection() {
    return (
        <section className="h-dvh relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-950 flex items-center justify-center">
            {/* Decorative Orbs */}
            <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>

            <div className="container max-w-6xl mx-auto px-4 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-purple-600 dark:text-purple-400 text-[10px] font-bold mb-4 luxury-shadow uppercase tracking-widest">
                        <Sparkles className="w-5 h-5 animate-spin-slow" />
                        <span>Kecerdasan Estetis</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white leading-[0.9]">
                        Dialog Yang Lebih <br />
                        <span className="gradient-text">Hidup & Penuh Rasa.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                    <div className="space-y-4">
                        {[
                            {
                                icon: <Brain className="w-7 h-7 text-blue-500" />,
                                title: "Topic Suggestions",
                                desc: "AI menganalisis suasana obrolan untuk ide segar."
                            },
                            {
                                icon: <MessageSquareHeart className="w-7 h-7 text-rose-500" />,
                                title: "Poetic Message",
                                desc: "Biarkan AI membuatkan draf pesan indah & personal."
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-5 rounded-3xl glass-card luxury-shadow hover:bg-white/80 dark:hover:bg-black/40 transition-all group">
                                <div className="shrink-0 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{item.title}</h3>
                                    <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-400 rounded-[4rem] opacity-30 blur-2xl animate-pulse"></div>
                        <div className="bg-gray-950 rounded-[3.5rem] p-1 shadow-2xl overflow-hidden border border-white/10 luxury-shadow">
                            <div className="bg-gray-900 rounded-[3.4rem] p-10 h-full flex flex-col justify-center relative">
                                <div className="space-y-6 relative z-10">
                                    <div className="flex gap-4 animate-fade-in-down">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shrink-0 shadow-lg luxury-shadow"></div>
                                        <div className="glass-card p-4 rounded-3xl rounded-tl-none text-white text-xs shadow-2xl">
                                            "Beri ide kata rindu hari ini?"
                                        </div>
                                    </div>

                                    <div className="flex flex-row-reverse gap-4 animate-fade-in animation-delay-1000">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shrink-0 flex items-center justify-center shadow-lg luxury-shadow">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-5 rounded-3xl rounded-tr-none text-white text-xs shadow-2xl relative">
                                            <Quote className="absolute -top-3 -left-3 w-6 h-6 text-white/20" />
                                            "Coba: 'Bayanganmu adalah tempat ternyaman untukku beristirahat.'"
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
