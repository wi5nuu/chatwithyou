import { Diamond, ShieldCheck, HeartPulse, Zap, Star } from 'lucide-react';

const benefits = [
    {
        icon: <Diamond className="w-6 h-6 text-amber-500" />,
        title: "Pengalaman Eksklusif",
        desc: "Kami bukan sekadar aplikasi chat. Kami adalah ruang rahasia yang dirancang khusus untuk kemewahan komunikasi pasangan."
    },
    {
        icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
        title: "Keamanan Tanpa Celah",
        desc: "Privasi Anda adalah prioritas tertinggi kami. Dengan protokol keamanan tercanggih, obrolan Anda selamanya menjadi rahasia."
    },
    {
        icon: <HeartPulse className="w-6 h-6 text-pink-500" />,
        title: "Kedekatan Emosional",
        desc: "Fitur kami membantu Anda membangun ikatan yang lebih dalam, bahkan jika terpisah jarak ribuan kilometer."
    },
    {
        icon: <Zap className="w-6 h-6 text-yellow-500" />,
        title: "Teknologi Terdepan",
        desc: "Performa secepat kilat tanpa delay, memastikan setiap kata dan nada suara Anda sampai dengan sempurna."
    }
];

export function Benefits() {
    return (
        <section className="h-dvh relative overflow-hidden bg-white dark:bg-gray-950 flex items-center justify-center">
            <div className="absolute top-0 right-0 w-72 h-72 bg-rose-100/50 dark:bg-rose-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-100/50 dark:bg-purple-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
                    <div className="lg:w-1/2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-semibold mb-5 luxury-shadow uppercase tracking-widest">
                            <Star className="w-3.5 h-3.5 fill-rose-500" />
                            <span>Kenapa Memilih LoveChat?</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-extrabold mb-5 leading-[0.9] text-gray-900 dark:text-white">
                            Lebih Dari Sekadar <br />
                            <span className="gradient-text">Aplikasi Pesan Biasa.</span>
                        </h2>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            {benefits.map((benefit, i) => (
                                <div key={i} className="group p-4 rounded-2xl glass-card transition-all hover:scale-105 hover:bg-white/90 dark:hover:bg-black/60 luxury-shadow">
                                    <div className="mb-3">{benefit.icon}</div>
                                    <h4 className="font-bold text-sm mb-1.5 text-gray-900 dark:text-white uppercase tracking-tight">{benefit.title}</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{benefit.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:block lg:w-1/2 relative">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-rose-400 via-purple-500 to-amber-400 rounded-[2rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative aspect-[4/5] max-h-[60dvh] rounded-[2rem] overflow-hidden luxury-shadow border-[6px] border-white dark:border-gray-800">
                                <img
                                    src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                    alt="Couple using app"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="absolute -top-4 -right-4 glass-card p-3 rounded-xl luxury-shadow animate-float">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-xs font-bold">100% Secured</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
