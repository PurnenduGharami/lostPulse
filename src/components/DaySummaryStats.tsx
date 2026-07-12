import type { TimeBlock } from '../types';

interface DaySummaryStatsProps {
  plannedBlocks: TimeBlock[];
  trackedBlocks: TimeBlock[];
}

export default function DaySummaryStats({ plannedBlocks, trackedBlocks }: DaySummaryStatsProps) {
  const plannedTimeMs = plannedBlocks.reduce((acc, b) => acc + (b.endTime - b.startTime), 0);
  const recordedTimeMs = trackedBlocks.reduce((acc, b) => acc + (b.endTime - b.startTime), 0);

  const plannedTasksCount = plannedBlocks.length;
  const completedTasksCount = plannedBlocks.filter(b => b.status === 'Completed').length;

  const focusSessions = trackedBlocks.filter(b => b.linkedPlannerTaskId || (b.title && b.title.includes('Focus')));
  const focusTimeMs = focusSessions.reduce((acc, b) => acc + (b.endTime - b.startTime), 0);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div className="col-span-2 md:col-span-2 liquid-panel p-4 rounded-md border border-[#333] flex flex-col items-center justify-center text-center">
        <span className="text-2xl md:text-3xl font-cinzel text-white mb-1">{formatDuration(plannedTimeMs)}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#aaaaaa]">Planned</span>
      </div>
      
      <div className="col-span-2 md:col-span-2 liquid-panel p-4 rounded-md border border-[#333] flex flex-col items-center justify-center text-center">
        <span className="text-2xl md:text-3xl font-cinzel text-emerald-400 mb-1">{formatDuration(recordedTimeMs)}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#aaaaaa]">Recorded</span>
      </div>

      <div className="col-span-2 md:col-span-2 liquid-panel p-4 rounded-md border border-[#333] flex flex-col items-center justify-center text-center">
        <span className="text-2xl md:text-3xl font-cinzel text-white mb-1">{completedTasksCount} <span className="text-sm text-[#555]">/ {plannedTasksCount}</span></span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#aaaaaa]">Completed</span>
      </div>

      <div className="col-span-1 md:col-span-3 liquid-panel p-4 rounded-md border border-[#333] flex flex-col items-center justify-center text-center">
        <span className="text-2xl md:text-3xl font-cinzel text-red-500 mb-1">{focusSessions.length}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#aaaaaa]">Focus Sessions</span>
      </div>

      <div className="col-span-1 md:col-span-3 liquid-panel p-4 rounded-md border border-[#333] flex flex-col items-center justify-center text-center">
        <span className="text-2xl md:text-3xl font-cinzel text-red-500 mb-1">{formatDuration(focusTimeMs)}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#aaaaaa]">Focus Time</span>
      </div>
    </div>
  );
}
