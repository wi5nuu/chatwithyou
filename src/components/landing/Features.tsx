import { Heart, Shield, Sparkles, Video, Mic, Globe } from 'lucide-react';

const features = [
    {
        title: "Enkripsi End-to-End",
        description: "Pesanmu hanya milikmu dan pasanganmu. Tidak ada orang lain yang bisa membacanya.",
        icon: <Shield className="w-8 h-8" />,
        color: "bg-blue-500"
    },
    {
        title: "AI Chat Assistant",
        description: "Dapatkan saran kata-kata romantis dan topik pembicaraan menarik dari AI pintar kami.",
        icon: <Sparkles className="w-8 h-8" />,
        color: "bg-purple-500"
    },
    {
        title: "Video Call HD",
        description: "Tatap muka dengan kualitas video jernih seolah-olah Anda berada di ruangan yang sama.",
        icon: <Video className="w-8 h-8" />,
        color: "bg-pink-500"
    },
    {
        title: "Pesan Suara",
        description: "Kirimkan kerinduanmu melalui suara yang hangat dengan fitur pesan suara instan.",
        icon: <Mic className="w-8 h-8" />,
        color: "bg-green-500"
    },
    {
        title: "Akses Di Mana Saja",
        description: "Terhubung dari perangkat apa pun, kapan pun, tanpa harus khawatir kehilangan percakapan.",
        icon: <Globe className="w-8 h-8" />,
        color: "bg-amber-500"
    },
    {
        title: "Dibuat Dengan Cinta",
        description: "Setiap fitur dirancang khusus untuk mempererat hubungan emosional Anda.",
        icon: <Heart className="w-8 h-8" />,
        color: "bg-rose-500"
    }
];

export function Features() {
    return (
        <section id="features" className="h-dvh relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>

            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-rose-600 dark:text-rose-400 text-[10px] font-bold mb-4 luxury-shadow uppercase tracking-widest">
                        <Heart className="w-3.5 h-3.5" />
                        <span>Fitur Tanpa Batas</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white leading-tight">
                        Kemewahan Dalam <span className="gradient-text">Setiap Sentuhan.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-5 md:p-6 rounded-3xl glass-card luxury-shadow hover:bg-white/90 dark:hover:bg-black/60 transition-all hover:-translate-y-1 relative overflow-hidden"
                        >
                            <div className={`${feature.color} w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-sm md:text-base font-black mb-1.5 text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors uppercase tracking-tight">{feature.title}</h3>
                            <p className="text-muted-foreground text-[10px] md:text-xs leading-relaxed line-clamp-2 md:line-clamp-none">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
