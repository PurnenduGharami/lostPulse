import { useMemo } from 'react';
import type { UserProfile, TimeBlock, Category } from '../types';
import { getBlocksForDay } from '../utils';

interface OverviewTabProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  categories: Category[];
  dailyNotes: Record<string, string[]>;
  currentDate: string;
}

export default function PlannerOverviewTab({ timeBlocks, categories, dailyNotes, currentDate }: OverviewTabProps) {
  const {
    plannedMs,
    completedMs,
    remainingPlannedMs,
    unplannedMs,
    categoryStats
  } = useMemo(() => {
    const blocks = getBlocksForDay(timeBlocks, currentDate);
    let planned = 0;
    let completed = 0;
    const catMap: Record<string, number> = {};

    blocks.forEach(b => {
      let duration = b.endTime !== b.startTime ? b.endTime - b.startTime : (b.estimatedDurationMs || 0);
      
      if (duration === 0 && b.accumulatedTimeMs && b.accumulatedTimeMs > 0) {
        duration = b.accumulatedTimeMs;
      }
      
      if (duration > 0) {
        planned += duration;
        if (b.status === 'Completed') {
          completed += Math.max(duration, b.accumulatedTimeMs || 0);
        } else {
          completed += b.accumulatedTimeMs || 0;
        }
        const cid = b.categoryId || b.category || 'uncategorized';
        catMap[cid] = (catMap[cid] || 0) + duration;
      }
    });

    const unplanned = Math.max(0, (24 * 3600000) - planned);
    const remainingPlanned = Math.max(0, planned - completed);

    const cats = Object.entries(catMap)
      .map(([id, duration]) => ({ id, duration }))
      .sort((a, b) => b.duration - a.duration);

    return {
      plannedMs: planned,
      completedMs: completed,
      remainingPlannedMs: remainingPlanned,
      unplannedMs: unplanned,
      categoryStats: cats
    };
  }, [currentDate, timeBlocks]);

  const percentagePlanned = (plannedMs / (24 * 3600000)) * 100;
  const percentageCompleted = plannedMs > 0 ? (completedMs / plannedMs) * 100 : 0;
  
  let status = 'Intentional';
  if (percentagePlanned >= 75) status = 'Highly Planned';
  else if (percentagePlanned >= 50) status = 'Intentional';
  else if (percentagePlanned >= 25) status = 'Lightly Planned';
  else status = 'Unplanned';

  const hasGoal = (dailyNotes[currentDate] || []).some(n => n.trim().length > 0);
  const plannerScore = Math.min(100, Math.round((percentageCompleted * 0.8) + (hasGoal ? 20 : 0)));

  const formatDuration = (ms: number) => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hrs === 0 && mins === 0) return '0m';
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  
  const plannedStroke = (plannedMs / (24 * 3600000)) * circumference;
  const completedStroke = (completedMs / (24 * 3600000)) * circumference;

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pb-4 pt-2 pr-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Section 1: Today's Distribution (1/3 Width) */}
      <div className="liquid-panel p-6 rounded-md flex flex-col items-center gap-6 relative overflow-hidden lg:col-span-1">
        {/* Top */}
        <span className="block text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest text-center">Planning Summary</span>
        
        {/* Middle: Dominant Graph Anchor */}
        <div className="relative w-40 h-40 md:w-56 md:h-56 flex-shrink-0 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-2xl" viewBox="0 0 200 200">
            {/* Background circle (Unplanned Time) */}
            <circle 
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#222222"
              strokeWidth="12"
            />
            {/* Planned Time (Base) */}
            <circle 
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#555555"
              strokeWidth="12"
              strokeDasharray={`${plannedStroke} ${circumference}`}
              strokeDashoffset={0}
              className="transition-all duration-1000"
            />
            {/* Completed Time (Red) */}
            <circle 
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#ef4444" // red-500
              strokeWidth="12"
              strokeDasharray={`${completedStroke} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              className="transition-all duration-1000 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            />
          </svg>
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none mt-2">
            <span className="text-4xl md:text-5xl font-serif text-white font-black tracking-tighter mb-1 drop-shadow-xl">
              {Math.round(percentagePlanned)}<span className="text-xl text-[#555555] font-light ml-1">%</span>
            </span>
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mb-1">Planned</span>
          </div>
        </div>

        {/* Bottom: Horizontal Summary Row */}
        <div className="w-full flex flex-row flex-wrap items-center justify-between sm:justify-between text-center mt-2 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mb-1">Executed</span>
            <span className="text-base md:text-lg font-serif text-red-500 font-bold">{formatDuration(completedMs)}</span>
          </div>
          <div className="w-[1px] h-5 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mb-1">Pending</span>
            <span className="text-base md:text-lg font-serif text-[#cccccc] font-medium">{formatDuration(remainingPlannedMs)}</span>
          </div>
          <div className="w-[1px] h-5 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mb-1">Unallocated</span>
            <span className="text-base md:text-lg font-serif text-[#cccccc] font-medium">{formatDuration(unplannedMs)}</span>
          </div>
        </div>

        {/* Severity Rating / Reflection */}
        <div className="w-full flex justify-between items-center border-t border-white/5 pt-4 mt-auto">
          <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest">Plan Status</span>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Unplanned' ? 'bg-red-500' : status === 'Lightly Planned' ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${status === 'Unplanned' ? 'text-red-500' : status === 'Lightly Planned' ? 'text-orange-500' : 'text-emerald-500'}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Awareness Index (Middle Card) */}
      <div className="liquid-panel p-6 rounded-md flex flex-col hover:scale-[1.01] transition-transform duration-300 lg:col-span-1 h-full">
        <h2 className="font-serif text-white font-bold text-xl mb-10 tracking-wide text-center">Purpose Index</h2>
        
        <div className="flex flex-col items-center justify-center mb-12 flex-1">
          <div className="relative flex items-baseline justify-center">
            <span className="text-7xl md:text-8xl font-cinzel text-white font-black tracking-tighter drop-shadow-2xl">
              {plannerScore}
            </span>
            <span className="text-xl md:text-2xl font-mono text-[#555555] ml-2 font-bold">/100</span>
          </div>
        </div>

        <div className="w-full flex justify-center gap-4 sm:gap-12 md:gap-20 h-40 mt-auto">
          {/* Factor 1: Completed Planned Time */}
          <div className="flex flex-col items-center justify-end h-full">
            <span className="text-base font-serif text-white font-bold mb-3">{Math.round(percentageCompleted)}%</span>
            <div className="w-5 h-full bg-black rounded-full overflow-hidden flex flex-col justify-end">
              <div className="w-full bg-red-500 rounded-full transition-all duration-1000" style={{ height: `${percentageCompleted}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mt-4 whitespace-nowrap">Realized</span>
          </div>

          {/* Factor 2: Remaining Planned Time */}
          <div className="flex flex-col items-center justify-end h-full">
            <span className="text-base font-serif text-white font-bold mb-3">{Math.round(100 - percentageCompleted)}%</span>
            <div className="w-5 h-full bg-black rounded-full overflow-hidden flex flex-col justify-end">
              <div className="w-full bg-[#333333] rounded-full transition-all duration-1000" style={{ height: `${100 - percentageCompleted}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mt-4 whitespace-nowrap">Pending</span>
          </div>

          {/* Factor 3: Today's Goal */}
          <div className="flex flex-col items-center justify-end h-full">
            <span className="text-base font-serif text-white font-bold mb-3">{hasGoal ? 'Set' : 'Missing'}</span>
            <div className="w-5 h-full bg-black rounded-full overflow-hidden flex flex-col justify-end">
              <div className={`w-full h-full rounded-full ${hasGoal ? 'bg-white' : 'bg-transparent border border-[#333333]'}`} />
            </div>
            <span className="text-[10px] font-mono text-[#aaaaaa] uppercase tracking-widest mt-4 whitespace-nowrap">Goal</span>
          </div>
        </div>
      </div>

      {/* Section 3: Category Reflection (Right Card) */}
      <div className="liquid-panel p-6 rounded-md flex flex-col flex-1 lg:col-span-1">
        <h2 className="font-serif text-white font-bold text-lg md:text-xl mb-4 tracking-wide text-center">Priority Distribution</h2>
        
        {categoryStats.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-mono text-[#555555] text-center">No planned time allocated today.</p>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2">
            {categoryStats.map(stat => {
              const cat = categories.find(c => c.id === stat.id) || categories.find(c => c.isUncategorized);
              const color = cat ? cat.color : '#555555';
              const name = cat ? cat.name : 'Unknown';
              const pct = plannedMs > 0 ? (stat.duration / plannedMs) * 100 : 0;
              
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

      {/* Section 4: Today's Goal (Bottom Full Width Card) */}
      <div className="liquid-panel p-6 md:p-8 rounded-md flex flex-col items-center justify-center lg:col-span-3">
        <h2 className="font-serif text-white font-bold text-xl mb-4 tracking-wide text-center">Today's Goal</h2>
        
        <div className="w-full text-center max-w-4xl mx-auto">
          {dailyNotes[currentDate] && dailyNotes[currentDate].length > 0 ? (
            <>
              <p className="text-2xl md:text-3xl font-cinzel text-red-500 font-bold tracking-widest mb-6">
                {dailyNotes[currentDate][0] || "No goal specified"}
              </p>
              {dailyNotes[currentDate][1] && (
                <div className="mt-4 border-t border-white/5 pt-4 max-w-2xl mx-auto">
                  <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest mb-2 block">Why it matters</span>
                  <p className="text-lg font-serif text-[#cccccc] italic">
                    "{dailyNotes[currentDate][1]}"
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-lg font-mono text-[#555555] italic">
              No goal has been set for today in the Planner tab.
            </p>
          )}
        </div>
      </div>


    </div>
  );
}
