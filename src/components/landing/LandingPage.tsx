import { Hero } from './Hero';
import { Features } from './Features';
import { Benefits } from './Benefits';
import { Security } from './Security';
import { AISection } from './AISection';
import { HowItWorks } from './HowItWorks';
import { Testimonials } from './Testimonials';
import { Footer } from './Footer';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LandingPageProps {
    onStartChat: () => void;
}

export function LandingPage({ onStartChat }: LandingPageProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen">
            {/* Navigation Header */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-3 shadow-sm'
                : 'bg-transparent py-6'
                }`}>
                <div className="container max-w-6xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                            LoveChat
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors uppercase tracking-widest">Fitur</a>
                        <a href="#benefits" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors uppercase tracking-widest">Manfaat</a>
                        <a href="#security" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors uppercase tracking-widest">Keamanan</a>
                        <a href="#how-it-works" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors uppercase tracking-widest">Cara Kerja</a>
                        <a href="#testimonials" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors uppercase tracking-widest">Testimoni</a>
                    </div>

                    <button
                        onClick={onStartChat}
                        className="px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-bold shadow-lg shadow-pink-500/20 transition-all hover:scale-105 transform active:scale-95"
                    >
                        Mulai Chat
                    </button>
                </div>
            </nav>

            <main>
                <div id="home"><Hero onStartChat={onStartChat} /></div>
                <div id="features"><Features /></div>
                <div id="benefits"><Benefits /></div>
                <div id="security"><Security /></div>
                <div id="ai"><AISection /></div>
                <div id="how-it-works"><HowItWorks /></div>
                <div id="testimonials"><Testimonials /></div>
            </main>

            <Footer onStartChat={onStartChat} />
        </div>
    );
}
