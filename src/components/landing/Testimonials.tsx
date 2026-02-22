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
        <section id="testimonials" className="py-16 relative overflow-hidden bg-gray-50/50 dark:bg-gray-900/30">
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/30 dark:bg-purple-900/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"></div>

            <div className="container max-w-5xl mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-amber-600 dark:text-amber-400 text-xs font-bold mb-4 luxury-shadow uppercase tracking-widest">
                        <Star className="w-4 h-4 fill-amber-500" />
                        <span>Kisah Nyata</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black mb-2 text-gray-900 dark:text-white leading-tight">
                        Dipercaya Oleh <span className="gradient-text">Ribuan Hati.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <div key={i} className="glass-card p-6 rounded-3xl luxury-shadow relative group hover:bg-white/90 dark:hover:bg-black/60 transition-all border-t-2 border-white/40">
                            <Quote className="absolute top-6 right-6 w-10 h-10 text-rose-500/10 group-hover:text-rose-500/20 transition-colors" />

                            <div className="flex gap-1 mb-4">
                                {[...Array(t.rating)].map((_, star) => (
                                    <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            <p className="text-gray-700 dark:text-gray-200 mb-6 text-sm leading-relaxed italic">
                                "{t.content}"
                            </p>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full blur-[2px]"></div>
                                    <Avatar className="w-11 h-11 border-2 border-white dark:border-gray-800 relative z-10">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}`} />
                                        <AvatarFallback className="font-bold text-xs">{t.avatar}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">{t.name}</h4>
                                    <p className="text-xs text-rose-500 font-black uppercase tracking-widest">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
