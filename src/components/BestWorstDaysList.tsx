import { useMemo } from 'react';

interface BestWorstDaysListProps {
  data: { date: string; alignment: number; trackedMs: number }[];
}

export default function BestWorstDaysList({ data }: BestWorstDaysListProps) {
  const { topDays, bottomDays } = useMemo(() => {
    const sorted = [...data].filter(d => d.alignment > 0).sort((a, b) => b.alignment - a.alignment);
    return {
      topDays: sorted.slice(0, 10),
      bottomDays: sorted.slice(-10).reverse() // reverse so absolute worst is first
    };
  }, [data]);

  const renderDay = (d: { date: string; alignment: number; trackedMs: number }, i: number, type: 'best' | 'worst') => (
    <div key={i} className="flex items-center justify-between p-3 border-b border-[#222] last:border-0 hover:bg-[#111] transition-colors">
      <div className="flex items-center gap-2 sm:gap-4">
        <span className={`font-mono text-sm w-6 text-center ${type === 'best' ? 'text-emerald-500' : 'text-red-500'}`}>
          {i + 1}
        </span>
        <span className="font-mono text-sm text-[#ccc]">{d.date}</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-6">
        <span className="font-mono text-[10px] text-[#666] w-16 text-right">
          {(d.trackedMs / 3600000).toFixed(1)}h
        </span>
        <span className={`font-mono text-sm w-12 text-right ${type === 'best' ? 'text-emerald-500' : 'text-red-500'}`}>
          {d.alignment}%
        </span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
        <h3 className="font-serif text-white text-lg mb-1">Top 10 Best Days</h3>
        <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
          Highest alignment scores
        </p>
        <div className="flex flex-col flex-1">
          {topDays.length > 0 ? topDays.map((d, i) => renderDay(d, i, 'best')) : (
            <div className="flex-1 flex items-center justify-center text-[#555] font-mono text-xs uppercase tracking-widest">
              No data available
            </div>
          )}
        </div>
      </div>

      <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
        <h3 className="font-serif text-white text-lg mb-1">Top 10 Worst Days</h3>
        <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
          Lowest alignment scores
        </p>
        <div className="flex flex-col flex-1">
          {bottomDays.length > 0 ? bottomDays.map((d, i) => renderDay(d, i, 'worst')) : (
            <div className="flex-1 flex items-center justify-center text-[#555] font-mono text-xs uppercase tracking-widest">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
