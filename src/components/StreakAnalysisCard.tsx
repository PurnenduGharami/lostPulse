import { useMemo } from 'react';

interface StreakAnalysisCardProps {
  data: { date: string; alignment: number }[];
}

export default function StreakAnalysisCard({ data }: StreakAnalysisCardProps) {
  const { current, longest, missed } = useMemo(() => {
    if (data.length === 0) return { current: 0, longest: 0, missed: 0 };
    
    let current = 0;
    let longest = 0;
    let currentMissed = 0;
    let maxMissed = 0;

    data.forEach(d => {
      if (d.alignment >= 50) {
        current++;
        currentMissed = 0;
        if (current > longest) longest = current;
      } else if (d.alignment > 0) { // tracked but low alignment
        current = 0;
        currentMissed++;
        if (currentMissed > maxMissed) maxMissed = currentMissed;
      } else {
        // Did not track anything?
        current = 0;
        currentMissed++;
        if (currentMissed > maxMissed) maxMissed = currentMissed;
      }
    });

    return { current, longest, missed: maxMissed };
  }, [data]);

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
      <h3 className="font-serif text-white text-lg mb-1">Streak Analysis</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Consistency of optimal days (Score &ge; 50)
      </p>

      <div className="flex flex-col gap-6 flex-1 justify-center">
        <div className="flex justify-between items-center border-b border-[#333] pb-4">
          <span className="font-mono text-sm text-[#ccc] uppercase tracking-widest">Current Streak</span>
          <span className="font-mono text-2xl text-emerald-500">{current} <span className="text-sm text-[#888]">days</span></span>
        </div>
        
        <div className="flex justify-between items-center border-b border-[#333] pb-4">
          <span className="font-mono text-sm text-[#ccc] uppercase tracking-widest">Longest Streak</span>
          <span className="font-mono text-2xl text-white">{longest} <span className="text-sm text-[#888]">days</span></span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-mono text-sm text-[#ccc] uppercase tracking-widest">Longest Missed</span>
          <span className="font-mono text-2xl text-red-500">{missed} <span className="text-sm text-[#888]">days</span></span>
        </div>
      </div>
    </div>
  );
}
