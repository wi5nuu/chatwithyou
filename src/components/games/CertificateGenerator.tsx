import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent
} from '@/components/ui/dialog';
import {
    Heart,
    Star,
    Download,
    Award,
    ShieldCheck,
    Calendar
} from 'lucide-react';
// import type { Profile } from '@/types';

interface CertificateGeneratorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    partnerName: string;
    userName: string;
    level: number;
}

export function CertificateGenerator({ open, onOpenChange, partnerName, userName, level }: CertificateGeneratorProps) {
    const certificateRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        // In a real app, we'd use something like html2canvas
        // For now, we'll simulate a print/save action
        window.print();
        toast.success('Menyiapkan sertifikat kalian... 💖');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                <div ref={certificateRef} className="relative p-8 bg-white dark:bg-gray-900 border-8 border-double border-rose-200 dark:border-rose-900/50 m-4 rounded-[2rem]">
                    {/* Background Decor */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                        <div className="absolute top-10 left-10"><Heart className="w-20 h-20 fill-rose-500" /></div>
                        <div className="absolute bottom-10 right-10"><Heart className="w-20 h-20 fill-rose-500" /></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[20px] border-rose-500 rounded-full w-[300px] h-[300px]" />
                    </div>

                    <div className="relative z-10 text-center space-y-6 py-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-rose-500 to-pink-600 rounded-full flex items-center justify-center p-1 shadow-xl shadow-pink-500/20">
                                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                                    <Award className="w-10 h-10 text-rose-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-sm font-black text-rose-500 uppercase tracking-[0.3em]">Sertifikat Cinta Sejati</h2>
                            <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-rose-500 to-transparent mx-auto" />
                        </div>

                        <div className="space-y-4 pt-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                Dengan ini menyatakan bahwa hubungan antara
                            </p>

                            <div className="flex flex-col gap-2">
                                <span className="text-2xl font-black text-gray-800 dark:text-white border-b-2 border-gray-100 dark:border-gray-800 inline-block px-4 py-1 mx-auto">
                                    {userName}
                                </span>
                                <span className="text-rose-500 font-black italic">&</span>
                                <span className="text-2xl font-black text-gray-800 dark:text-white border-b-2 border-gray-100 dark:border-gray-800 inline-block px-4 py-1 mx-auto">
                                    {partnerName}
                                </span>
                            </div>

                            <p className="text-xs font-medium text-gray-500 px-6 italic">
                                Telah berhasil mencapai level tertinggi dalam pengabdian dan cinta di platform LoveChat, membuktikan bahwa jarak dan waktu hanyalah angka.
                            </p>
                        </div>

                        <div className="pt-8 grid grid-cols-2 gap-8 relative">
                            <div className="space-y-1">
                                <div className="h-px bg-gray-200 dark:bg-gray-800 mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-green-500" /> Verifikasi Cinta
                                </p>
                                <p className="text-[8px] text-gray-400 italic">Level {level} / 19</p>
                            </div>
                            <div className="space-y-1">
                                <div className="h-px bg-gray-200 dark:bg-gray-800 mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1">
                                    <Calendar className="w-3 h-3 text-blue-500" /> Tanggal
                                </p>
                                <p className="text-[8px] text-gray-400 italic">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>

                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-110 opacity-10 pointer-events-none">
                                <Star className="w-20 h-20 text-amber-500 fill-amber-500" />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-center">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-full border border-rose-100 dark:border-rose-800">
                                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                                <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tighter italic">LoveChat Official Seal</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex gap-4">
                    <Button
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl py-6 font-bold shadow-lg shadow-pink-500/20 gap-2"
                        onClick={handleDownload}
                    >
                        <Download className="w-5 h-5" /> Download / Print sertifikat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Internal toast helper fix
const toast = {
    success: (msg: string) => console.log('Toast SUCCESS:', msg),
    error: (msg: string) => console.log('Toast ERROR:', msg)
};
