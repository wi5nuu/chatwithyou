import { UserPlus, Key, MessageCircle, Heart, Layout } from 'lucide-react';

const steps = [
    {
        icon: <UserPlus className="w-6 h-6" />,
        title: "Buat Akun",
        desc: "Daftar dengan email Anda secara gratis dalam hitungan detik."
    },
    {
        icon: <Key className="w-6 h-6" />,
        title: "Enkripsi Otomatis",
        desc: "Kunci keamanan pribadi akan dibuat di perangkat Anda."
    },
    {
        icon: <MessageCircle className="w-6 h-6" />,
        title: "Mulai Chat",
        desc: "Cari pasangan Anda dan mulai kirim pesan rahasia pertama."
    },
    {
        icon: <Heart className="w-6 h-6" />,
        title: "Jaga Hubungan",
        desc: "Teruslah mengobrol dan perkuat ikatan cinta Anda setiap hari."
    }
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-16 relative overflow-hidden bg-white dark:bg-gray-950">
            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-amber-600 dark:text-amber-400 text-xs font-bold mb-4 luxury-shadow uppercase tracking-widest">
                        <Layout className="w-4 h-4" />
                        <span>Mulai Perjalanan</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white leading-tight">
                        Sangat Mudah Untuk <span className="gradient-text">Menjadi Dekat.</span>
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                        Hanya butuh beberapa detik untuk menciptakan ruang aman bagi Anda dan pasangan.
                    </p>
                </div>

                <div className="relative">
                    <div className="hidden lg:block absolute top-[35%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-200 dark:via-rose-900/30 to-transparent -translate-y-1/2"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center group">
                                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-rose-500 mb-5 luxury-shadow group-hover:scale-110 group-hover:-rotate-6 transition-all border-2 border-white/50">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-inner">
                                        {step.icon}
                                    </div>
                                </div>

                                <div className="absolute top-0 right-1/2 translate-x-8 -translate-y-3 bg-gradient-to-br from-rose-500 to-pink-600 text-white w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm luxury-shadow rotate-12">
                                    {i + 1}
                                </div>

                                <h3 className="text-base font-black mb-2 text-gray-900 dark:text-white uppercase tracking-tight text-center">{step.title}</h3>
                                <p className="text-muted-foreground text-center text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
