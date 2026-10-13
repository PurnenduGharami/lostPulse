import { UserProfile } from '../types';
import { calculateLifeRemaining } from '../utils';

interface HeroSectionProps {
  userProfile: UserProfile;
  scrollTop: number;
}

export default function HeroSection({ userProfile, scrollTop }: HeroSectionProps) {
  const life = calculateLifeRemaining(userProfile);
  const opacity = Math.max(0, 1 - scrollTop / 400);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-between p-8 relative z-10" style={{ opacity }}>
      <div className="text-center space-y-2 pt-12">
        <span className="font-mono text-xs tracking-[0.3em] text-red-500 uppercase">
          KRONOS SYSTEM v2.0
        </span>
        <h1 className="text-5xl font-extrabold font-mono tracking-wider text-white">
          LOST PULSE
        </h1>
      </div>

      <div className="w-full max-w-2xl liquid-glass border border-[#333333] p-8 rounded-3xl text-center space-y-6 shadow-2xl">
        <div>
          <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
            OPERATOR: {userProfile.name}
          </span>
          <div className="text-6xl font-mono font-black text-white mt-2">
            {life.percentage.toFixed(4)}%
          </div>
          <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
            Lifespan Elapsed
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#222222]">
          <div>
            <div className="text-2xl font-mono font-bold text-white">{life.years}</div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Years Left</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white">{life.days}</div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Days Left</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white">{life.hours}</div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Hours Left</div>
          </div>
        </div>
      </div>

      <div className="text-center pb-8 animate-bounce">
        <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
          ↓ SCROLL TO ENTER KRONOS RECORD
        </span>
      </div>
    </div>
  );
}
