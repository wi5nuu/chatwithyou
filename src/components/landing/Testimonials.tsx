import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
    {
        name: "Andi & Siti",
        role: "LDR 2 Tahun",
        content: "LoveChat benar-benar menyelamatkan hubungan LDR kami. Fitur AI Suggestion sangat membantu saat kami sedang lelah bekerja tapi tetap ingin ngobrol manis.",
        avatar: "AS",
        rating: 5
    },
    {
        name: "Budi & Laras",
        role: "Pasangan Menikah",
        content: "Kami suka betapa amannya aplikasi ini. Sangat pribadi dan fiturnya lengkap sekali, terutama video call-nya yang sangat stabil.",
        avatar: "BL",
        rating: 5
    },
    {
        name: "Rizky & Dinda",
        role: "Baru Tunangan",
        content: "Desainnya sangat cantik dan premium! Tidak seperti aplikasi chat lainnya yang terasa kaku. LoveChat terasa sangat personal.",
        avatar: "RD",
        rating: 5
    }
];

export function Testimonials() {
    return (
        <section className="h-[100dvh] relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-center">
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"></div>

            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-amber-600 dark:text-amber-400 text-[10px] font-bold mb-4 luxury-shadow uppercase tracking-widest">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>Kisah Nyata</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black mb-2 text-gray-900 dark:text-white leading-[0.9]">
                        Dipercaya Oleh <span className="gradient-text">Ribuan Hati.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {testimonials.map((t, i) => (
                        <div key={i} className="glass-card p-6 rounded-3xl luxury-shadow relative group hover:bg-white/90 dark:hover:bg-black/60 transition-all">
                            <Quote className="absolute top-4 right-4 w-6 h-6 text-rose-500/10" />

                            <div className="flex gap-1 mb-3">
                                {[...Array(t.rating)].map((_, star) => (
                                    <Star key={star} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            <p className="text-gray-700 dark:text-gray-200 mb-6 text-xs leading-relaxed italic line-clamp-3">
                                "{t.content}"
                            </p>

                            <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9 border-2 border-white dark:border-gray-800">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}`} />
                                    <AvatarFallback className="font-bold text-[10px]">{t.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-black text-xs text-gray-900 dark:text-white uppercase tracking-tight">{t.name}</h4>
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
