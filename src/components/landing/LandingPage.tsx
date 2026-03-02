import { Hero } from './Hero';
import { Features } from './Features';
import { Benefits } from './Benefits';
import { Security } from './Security';
import { AISection } from './AISection';
import { HowItWorks } from './HowItWorks';
import { Testimonials } from './Testimonials';
import { Footer } from './Footer';
import { Heart, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LandingPageProps {
    onStartChat: () => void;
}

export function LandingPage({ onStartChat }: LandingPageProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
            setShowScrollTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const navLinks = [
        { href: '#features', label: 'Fitur' },
        { href: '#benefits', label: 'Manfaat' },
        { href: '#security', label: 'Keamanan' },
        { href: '#how-it-works', label: 'Cara Kerja' },
        { href: '#testimonials', label: 'Testimoni' },
    ];

    return (
        <div className="bg-white dark:bg-gray-950 min-h-screen">
            {/* Navigation Header */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 py-3 shadow-sm'
                : 'bg-transparent py-4 md:py-6'
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

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-rose-500 transition-colors uppercase tracking-widest">
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onStartChat}
                            className="px-4 md:px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-bold shadow-lg shadow-pink-500/20 transition-all hover:scale-105 transform active:scale-95"
                        >
                            Mulai Chat
                        </button>
                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            onClick={() => setMobileMenuOpen(o => !o)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex flex-col gap-1">
                        {navLinks.map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-2.5 px-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-colors uppercase tracking-widest"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}
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

            {/* Scroll to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-50 p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                    }`}
                aria-label="Scroll to top"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity animate-pulse" />
                <Heart className="w-6 h-6 text-pink-500 fill-transparent group-hover:fill-pink-500 transition-all" />
            </button>
        </div>
    );
}
