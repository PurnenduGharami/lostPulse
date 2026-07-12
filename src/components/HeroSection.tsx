import React, { useEffect, useState, useRef, memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { calculateLifeRemaining } from '../utils';
import type { UserProfile } from '../types';

interface HeroSectionProps {
  userProfile: UserProfile;
}

// Memoized Countdown component prevents the entire HeroSection from re-rendering every second
const CountdownDisplay = memo(({ userProfile, textOpacity }: { userProfile: UserProfile, textOpacity: number }) => {
  const [countdown, setCountdown] = useState(() => calculateLifeRemaining(userProfile));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateLifeRemaining(userProfile));
    }, 1000);
    return () => clearInterval(interval);
  }, [userProfile]);

  return (
    <div
      className="absolute bottom-[1%] w-full text-center px-2 z-20 flex flex-col items-center justify-end transition-all duration-300 pointer-events-none"
      style={{ opacity: textOpacity }}
    >
      <div className="scale-100 xs:scale-[1.1] lg:scale-[1.36] origin-bottom flex flex-col items-center select-none pointer-events-auto">
        {countdown.isOverdue && (
          <div className="text-red-500 text-sm uppercase tracking-[0.3em] font-sans font-black mb-3 animate-pulse">
            OVERDUE
          </div>
        )}

        <div className="font-cinzel flex flex-col items-center justify-center space-y-2">
          <div className="text-xl sm:text-2xl lg:text-4xl text-[#F0EDE8] tracking-[0.05em] flex items-baseline gap-3 sm:gap-4 font-bold">
            <span>{countdown.years} <span className="uppercase text-lg sm:text-2xl lg:text-3xl font-medium">YEARS</span></span>
            <span>{countdown.days} <span className="uppercase text-lg sm:text-2xl lg:text-3xl font-medium">DAYS</span></span>
            <span>{countdown.hours} <span className="uppercase text-lg sm:text-2xl lg:text-3xl font-medium">HOURS</span></span>
          </div>

          <div className="text-lg sm:text-xl lg:text-2xl tracking-[0.05em] flex items-baseline gap-4 sm:gap-8 mt-0 font-bold">
            <span className="text-[#ff1a1a]">{countdown.minutes} <span className="text-[#F0EDE8] uppercase text-md sm:text-lg lg:text-xl ml-1 sm:ml-2 font-medium">MINUTES</span></span>
            <span className="text-[#ff1a1a]">{countdown.seconds} <span className="text-[#F0EDE8] uppercase text-md sm:text-lg lg:text-xl ml-1 sm:ml-2 font-medium">SECONDS</span></span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 font-cinzel text-xs sm:text-xs tracking-[0.3em] text-white/50 uppercase select-none mt-6 animate-pulse">
          <span>...REMAINING...</span>
        </div>
        <div className="flex justify-center mt-4">
          <ChevronDown className="w-6 h-6 text-white/30 animate-bounce" />
        </div>
      </div>
    </div>
  );
});
CountdownDisplay.displayName = 'CountdownDisplay';

export default function HeroSection({ userProfile }: HeroSectionProps) {
  const [scrollY, setScrollY] = useState(0);
  const maskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const textOpacity = Math.max(1 - scrollY / (windowHeight * 0.45), 0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!maskRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const maskStyle = `radial-gradient(circle 150px at ${x}px ${y}px, black 0%, transparent 100%)`;
    maskRef.current.style.webkitMaskImage = maskStyle;
    maskRef.current.style.maskImage = maskStyle;
  };

  return (
    <div className="relative w-full h-[100vh] flex flex-col items-center justify-end z-10 select-none overflow-hidden bg-transparent">
      {/* 3 Vertical Sections Overlay with Spotlight Mask */}
      <div
        ref={maskRef}
        className="absolute inset-0 z-10 flex flex-row w-full h-full pointer-events-auto"
        onMouseMove={handleMouseMove}
        style={{
          WebkitMaskImage: `radial-gradient(circle 150px at -1000px -1000px, black 0%, transparent 100%)`,
          maskImage: `radial-gradient(circle 150px at -1000px -1000px, black 0%, transparent 100%)`,
        }}
      >
        <div
          className="flex-1 h-full relative opacity-0 hover:opacity-100 transition-opacity duration-500 overflow-hidden"
          style={{ WebkitMaskImage: 'linear-gradient(to right, black 0%, black 60%, transparent 100%)', maskImage: 'linear-gradient(to right, black 0%, black 60%, transparent 100%)' }}
        >
          <img src="/assets/left.png" className="absolute inset-0 w-full h-[105%] -top-[2.5%] object-cover block" alt="Left" />
        </div>
        <div className="flex-1 h-full pointer-events-none"></div>
        <div
          className="flex-1 h-full relative opacity-0 hover:opacity-100 transition-opacity duration-500 overflow-hidden"
          style={{ WebkitMaskImage: 'linear-gradient(to left, black 0%, black 60%, transparent 100%)', maskImage: 'linear-gradient(to left, black 0%, black 60%, transparent 100%)' }}
        >
          <img src="/assets/right.png" className="absolute inset-0 w-full h-[105%] -top-[2.5%] object-cover block" alt="Right" />
        </div>
      </div>

      {/* Refined Countdown clock display in bottom middle of the screen */}
      <CountdownDisplay userProfile={userProfile} textOpacity={textOpacity} />
    </div>
  );
}
