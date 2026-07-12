import { useMemo, useState, useEffect } from 'react';
import type { UserProfile } from '../types';

interface LifeRemainingCardProps {
  userProfile: UserProfile;
}

export default function LifeRemainingCard({ userProfile }: LifeRemainingCardProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const lifeRemaining = useMemo(() => {
    if (!userProfile.birthDate) return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0, percentage: 100 };
    const dob = new Date(userProfile.birthDate).getTime();
    const lifeExpectancyMs = (userProfile.targetLifespan || 80) * 365.25 * 24 * 3600000;
    const endDate = dob + lifeExpectancyMs;
    const remainingMs = Math.max(0, endDate - now);
    
    return {
      years: Math.floor(remainingMs / (365.25 * 24 * 3600000)),
      days: Math.floor((remainingMs % (365.25 * 24 * 3600000)) / (24 * 3600000)),
      hours: Math.floor((remainingMs % (24 * 3600000)) / 3600000),
      minutes: Math.floor((remainingMs % 3600000) / 60000),
      seconds: Math.floor((remainingMs % 60000) / 1000),
      percentage: Math.max(0, Math.min(100, (remainingMs / lifeExpectancyMs) * 100))
    };
  }, [now, userProfile]);

  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      <div className="text-3xl md:text-4xl font-cinzel text-white font-bold tracking-widest mb-1 drop-shadow-md">
        {lifeRemaining.years}Y {lifeRemaining.days}D {lifeRemaining.hours}H
      </div>
      <div className="text-xl md:text-3xl font-cinzel text-red-500 tracking-widest mb-2 drop-shadow-md">
        {lifeRemaining.minutes}M {lifeRemaining.seconds}S
      </div>
      <span className="text-xs font-mono text-[#555555] uppercase tracking-widest mb-6">Estimated Life Remaining</span>

      <div className="w-full max-w-[280px]">
        <div className="flex justify-between text-[10px] font-mono text-[#aaaaaa] mb-2 uppercase tracking-widest">
          <span>Spent: {100 - Math.round(lifeRemaining.percentage)}%</span>
          <span>Remaining: {Math.round(lifeRemaining.percentage)}%</span>
        </div>
        <div className="w-full h-1.5 flex rounded-full overflow-hidden bg-[#111] shadow-inner">
          <div className="h-full bg-[#555]" style={{width: `${100 - lifeRemaining.percentage}%`}}></div>
          <div className="h-full bg-red-700" style={{width: `${lifeRemaining.percentage}%`}}></div>
        </div>
      </div>
    </div>
  );
}
