import { useMemo, useState, useEffect } from 'react';
import type { UserProfile, TimeBlock, Category } from '../types';
import { getBlocksForDay } from '../utils';
import LifeRemainingCard from './LifeRemainingCard';

interface OverviewTabProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  categories: Category[];
  dailyNotes: Record<string, string[]>;
  currentDate: string;
}

export default function OverviewTab({ userProfile, timeBlocks, categories, dailyNotes, currentDate }: OverviewTabProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    markedMs,
    unmarkedMs,
    remainingMs,
    totalElapsedMs,
    categoryStats
  } = useMemo(() => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const startOfDay = new Date(y, m - 1, d, 0, 0, 0).getTime();
    const endOfDay = startOfDay + 24 * 3600000;

    const isPast = endOfDay <= now;
    const isFuture = startOfDay > now;

    let elapsed = 0;
    let remaining = 0;

    if (isPast) {
      elapsed = 24 * 3600000;
      remaining = 0;
    } else if (isFuture) {
      elapsed = 0;
      remaining = 24 * 3600000;
    } else {
      elapsed = now - startOfDay;
      remaining = endOfDay - now;
    }

    const blocks = getBlocksForDay(timeBlocks, currentDate);
    let marked = 0;
    const catMap: Record<string, number> = {};

    const intervals: { start: number; end: number }[] = [];

    blocks.forEach(b => {
      const actualStart = Math.max(startOfDay, b.startTime);
      const actualEnd = Math.min(endOfDay, b.endTime);
      const duration = actualEnd - actualStart;
      
      if (duration > 0) {
        intervals.push({ start: actualStart, end: actualEnd });
        const cid = b.categoryId || b.category || 'uncategorized';
        catMap[cid] = (catMap[cid] || 0) + duration;
      }
    });

    // Merge intervals to calculate true marked time without double-counting overlaps
    intervals.sort((a, b) => a.start - b.start);
    let mergedMarked = 0;
    if (intervals.length > 0) {
      let currentStart = intervals[0].start;
      let currentEnd = intervals[0].end;

      for (let i = 1; i < intervals.length; i++) {
        if (intervals[i].start <= currentEnd) {
          currentEnd = Math.max(currentEnd, intervals[i].end);
        } else {
          mergedMarked += currentEnd - currentStart;
          currentStart = intervals[i].start;
          currentEnd = intervals[i].end;
        }
      }
      mergedMarked += currentEnd - currentStart;
    }
    
    // Also cap marked time to total elapsed to prevent future blocks from causing >100%
    marked = Math.min(mergedMarked, elapsed);

    const unmarked = Math.max(0, elapsed - marked);

    const cats = Object.entries(catMap)
      .map(([id, duration]) => ({ id, duration }))
      .sort((a, b) => b.duration - a.duration);

    return {
      markedMs: marked,
      unmarkedMs: unmarked,
      remainingMs: remaining,
      totalElapsedMs: elapsed,
      categoryStats: cats
    };
  }, [currentDate, timeBlocks, now]);

  const percentageMarked = totalElapsedMs > 0 ? (markedMs / totalElapsedMs) * 100 : 0;
  const percentageUnmarked = totalElapsedMs > 0 ? (unmarkedMs / totalElapsedMs) * 100 : 0;
  
  let status = 'Present';
  if (totalElapsedMs > 0) {
    if (percentageMarked >= 75) status = 'Present';
    else if (percentageMarked >= 50) status = 'Intentional';
    else if (percentageMarked >= 25) status = 'Drifting';
    else status = 'Lost';
  }

  const hasNotes = (dailyNotes[currentDate] || []).some(n => n.trim().length > 0);
  const awarenessIndex = Math.min(100, Math.round((percentageMarked * 0.8) + (hasNotes ? 20 : 0)));

  const formatDuration = (ms: number) => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hrs === 0 && mins === 0) return '0m';
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  // Chart is out of 24 hours.
  // Marked = Red, Unmarked = Dark Grey, Remaining = Transparent
  const markedStroke = (markedMs / (24 * 3600000)) * circumference;
  const unmarkedStroke = (unmarkedMs / (24 * 3600000)) * circumference;

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pb-4 pt-2 pr-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Section 1: Today's Distribution (1/3 Width) */}
      <div className="liquid-panel p-6 rounded-md flex flex-col items-center gap-6 relative overflow-hidden lg:col-span-1">
        {/* Top */}
        <span className="block text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest text-center">Today's Reflection</span>
        
        {/* Middle: Dominant Graph Anchor */}
        <div className="relative w-40 h-40 md:w-56 md:h-56 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 200 200">
            {/* Background circle (Remaining Time) */}
            <circle 
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="12"
            />
            {/* Unmarked Time */}
            <circle 
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#222222"
              strokeWidth="12"
              strokeDasharray={`${unmarkedStroke} ${circumference}`}
              strokeDashoffset={0}
              className="transition-all duration-1000"
            />
            {/* Marked Time */}
            <circle 
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#ef4444" // red-500
              strokeWidth="12"
              strokeDasharray={`${markedStroke} ${circumference}`}
              strokeDashoffset={-unmarkedStroke}
              strokeLinecap="round"
              className="transition-all duration-1000 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            />
          </svg>
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none mt-2">
            <span className="text-4xl md:text-5xl font-serif text-white font-black tracking-tighter mb-1 drop-shadow-xl">
              {Math.round(percentageMarked)}<span className="text-xl text-[#555555] font-light ml-1">%</span>
            </span>
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mb-1">Marked</span>
          </div>
        </div>

        {/* Bottom: Horizontal Summary Row */}
        <div className="w-full flex flex-row items-center justify-between text-center mt-2 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mb-1">Marked</span>
            <span className="text-base md:text-lg font-serif text-red-500 font-bold">{formatDuration(markedMs)}</span>
          </div>
          <div className="w-[1px] h-5 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mb-1">Unmarked</span>
            <span className="text-base md:text-lg font-serif text-[#cccccc] font-medium">{formatDuration(unmarkedMs)}</span>
          </div>
          <div className="w-[1px] h-5 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mb-1">Remaining</span>
            <span className="text-base md:text-lg font-serif text-[#cccccc] font-medium">{formatDuration(remainingMs)}</span>
          </div>
        </div>

        {/* Severity Rating / Reflection */}
        <div className="w-full flex justify-between items-center border-t border-white/5 pt-4 mt-auto">
          <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest">Today's Reflection</span>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Lost' ? 'bg-red-500' : status === 'Drifting' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${status === 'Lost' ? 'text-red-500' : status === 'Drifting' ? 'text-orange-500' : 'text-emerald-500'}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Awareness Index (Middle Card) */}
      <div className="liquid-panel p-6 rounded-md flex flex-col hover:scale-[1.01] transition-transform duration-300 lg:col-span-1 h-full">
        <h2 className="font-serif text-white font-bold text-xl mb-10 tracking-wide text-center">Awareness Index</h2>
        
        <div className="flex flex-col items-center justify-center mb-12 flex-1">
          <div className="relative flex items-baseline justify-center">
            <span className="text-7xl md:text-8xl font-cinzel text-white font-black tracking-tighter drop-shadow-2xl">
              {awarenessIndex}
            </span>
            <span className="text-xl md:text-2xl font-mono text-[#555555] ml-2 font-bold">/100</span>
          </div>
        </div>

        <div className="w-full flex justify-center gap-12 md:gap-20 h-40 mt-auto">
          {/* Factor 1: Marked Time */}
          <div className="flex flex-col items-center justify-end h-full">
            <span className="text-base font-serif text-white font-bold mb-3">{Math.round(percentageMarked)}%</span>
            <div className="w-5 h-full bg-black rounded-full overflow-hidden flex flex-col justify-end">
              <div className="w-full bg-red-500 rounded-full transition-all duration-1000" style={{ height: `${percentageMarked}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mt-4 whitespace-nowrap">Marked</span>
          </div>

          {/* Factor 2: Unmarked Time */}
          <div className="flex flex-col items-center justify-end h-full">
            <span className="text-base font-serif text-white font-bold mb-3">{Math.round(percentageUnmarked)}%</span>
            <div className="w-5 h-full bg-black rounded-full overflow-hidden flex flex-col justify-end">
              <div className="w-full bg-[#333333] rounded-full transition-all duration-1000" style={{ height: `${percentageUnmarked}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mt-4 whitespace-nowrap">Unmarked</span>
          </div>

          {/* Factor 3: Daily Note */}
          <div className="flex flex-col items-center justify-end h-full">
            <span className="text-base font-serif text-white font-bold mb-3">{hasNotes ? 'Done' : 'Missing'}</span>
            <div className="w-5 h-full bg-black rounded-full overflow-hidden flex flex-col justify-end">
              <div className={`w-full h-full rounded-full ${hasNotes ? 'bg-white' : 'bg-transparent border border-[#333333]'}`} />
            </div>
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mt-4 whitespace-nowrap">Note</span>
          </div>
        </div>
      </div>

      {/* Section 3: Category Reflection (Right Card) */}
      <div className="liquid-panel p-6 rounded-md flex flex-col flex-1 lg:col-span-1">
        <h2 className="font-serif text-white font-bold text-lg md:text-xl mb-4 tracking-wide text-center">Category Reflection</h2>
        
        {categoryStats.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-mono text-[#555555] text-center">No intentional time recorded today.</p>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2">
            {categoryStats.map(stat => {
              const cat = categories.find(c => c.id === stat.id) || categories.find(c => c.isUncategorized);
              const color = cat ? cat.color : '#555555';
              const name = cat ? cat.name : 'Unknown';
              const pct = markedMs > 0 ? (stat.duration / markedMs) * 100 : 0;
              
              return (
                <div key={stat.id} className="flex flex-col">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-mono text-white uppercase tracking-widest truncate mr-2">{name}</span>
                    <div className="flex items-baseline space-x-3 shrink-0">
                      <span className="text-xs font-mono text-[#aaaaaa]">{formatDuration(stat.duration)}</span>
                      <span className="text-sm font-serif text-white font-bold" style={{ color }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 4: Countdowns (Bottom Full Width Card) */}
      <div className="liquid-panel p-6 md:p-8 rounded-md flex flex-col items-center justify-center lg:col-span-3">
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center justify-center">
          
          {/* Day Remaining */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-2xl md:text-3xl font-cinzel text-white font-bold tracking-widest flex items-baseline gap-3 mb-2">
              <span>{Math.floor(remainingMs / 3600000)} <span className="text-sm font-medium text-[#aaaaaa]">H</span></span>
              <span>{Math.floor((remainingMs % 3600000) / 60000)} <span className="text-sm font-medium text-[#aaaaaa]">M</span></span>
              <span className="text-red-500">{Math.floor((remainingMs % 60000) / 1000)} <span className="text-sm font-medium text-red-500/50">S</span></span>
            </div>
            <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest mb-6">Remaining Today</span>
            
            <div className="w-full max-w-[280px]">
              <div className="flex justify-between text-[10px] font-mono text-[#aaaaaa] mb-2 uppercase tracking-widest">
                <span>Spent: {Math.round((totalElapsedMs / (24 * 3600000)) * 100)}%</span>
                <span>Remaining: {Math.round((remainingMs / (24 * 3600000)) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 flex rounded-full overflow-hidden bg-[#111] shadow-inner">
                <div className="h-full bg-[#555]" style={{width: `${(totalElapsedMs / (24 * 3600000)) * 100}%`}}></div>
                <div className="h-full bg-red-700" style={{width: `${(remainingMs / (24 * 3600000)) * 100}%`}}></div>
              </div>
            </div>
          </div>

          {/* Life Remaining */}
          <div className="flex flex-col items-center justify-center text-center md:border-l border-white/5 md:pl-8 lg:pl-16">
            <LifeRemainingCard userProfile={userProfile} />
          </div>

        </div>
      </div>


    </div>
  );
}
