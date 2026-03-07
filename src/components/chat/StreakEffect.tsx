import React, { useEffect, useState } from 'react';

interface StreakEffectProps {
    count: number;
    onComplete: () => void;
}

export const StreakEffect: React.FC<StreakEffectProps> = ({ count, onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onComplete();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    // Intensity increases with count
    const intensity = Math.min(count / 30, 1);
    const glowSize = 20 + (intensity * 100);
    const isLegendary = count >= 30;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
            {/* Central Flame/Glow */}
            <div
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000 animate-out fade-out zoom-out`}
                style={{
                    background: isLegendary
                        ? 'radial-gradient(circle, rgba(255,69,0,0.8) 0%, rgba(255,140,0,0.4) 50%, transparent 100%)'
                        : `radial-gradient(circle, rgba(255,165,0,${0.3 + intensity * 0.5}) 0%, transparent 70%)`,
                    boxShadow: `0 0 ${glowSize}px ${isLegendary ? glowSize / 2 : glowSize / 4}px ${isLegendary ? '#ff4500' : '#ffa500'}`,
                    transform: `scale(${1 + intensity})`
                }}
            >
                <div className="text-6xl animate-bounce">
                    {isLegendary ? '🔥👑' : '🔥'}
                </div>

                {/* Particle/Ring effects for legendary */}
                {isLegendary && (
                    <div className="absolute inset-0 border-4 border-orange-500 rounded-full animate-ping opacity-50" />
                )}
            </div>

            {/* Floating Scores */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="animate-bounce text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    +{isLegendary ? '50' : '10'} Points!
                </div>
            </div>

            {/* Screen Flash for high streaks */}
            {intensity > 0.5 && (
                <div
                    className="absolute inset-0 bg-orange-500/10 animate-pulse"
                    style={{ animationDuration: '0.2s' }}
                />
            )}
        </div>
    );
};
