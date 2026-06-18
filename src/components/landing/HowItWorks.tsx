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
        <section className="h-dvh relative overflow-hidden bg-white dark:bg-gray-950 flex items-center justify-center">
            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-amber-600 dark:text-amber-400 text-[10px] font-bold mb-4 luxury-shadow uppercase tracking-widest">
                        <Layout className="w-3.5 h-3.5" />
                        <span>Mulai Perjalanan</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white leading-[0.9]">
                        Sangat Mudah Untuk <span className="gradient-text">Menjadi Dekat.</span>
                    </h2>
                </div>

                <div className="relative">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {steps.map((step, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center group">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl glass-card flex items-center justify-center text-rose-500 mb-4 luxury-shadow group-hover:scale-110 transition-all">
                                    <div className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-xl shadow-inner">
                                        {step.icon}
                                    </div>
                                </div>

                                <div className="absolute top-0 right-1/2 translate-x-6 -translate-y-2 bg-gradient-to-br from-rose-500 to-pink-600 text-white w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] luxury-shadow rotate-12">
                                    {i + 1}
                                </div>

                                <h3 className="text-xs md:text-sm font-black mb-1 text-gray-900 dark:text-white uppercase tracking-tight text-center">{step.title}</h3>
                                <p className="text-muted-foreground text-center text-[10px] leading-tight max-w-[120px]">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
