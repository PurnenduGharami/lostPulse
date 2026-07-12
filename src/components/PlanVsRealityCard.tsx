import { useMemo } from 'react';
import type { TimeBlock, Category } from '../types';

interface PlanVsRealityCardProps {
  plannedBlocks: TimeBlock[];
  trackedBlocks: TimeBlock[];
  categories: Category[];
}

interface CategoryStats {
  id: string;
  name: string;
  color: string;
  plannedMs: number;
  actualMs: number;
}

export default function PlanVsRealityCard({ plannedBlocks, trackedBlocks, categories }: PlanVsRealityCardProps) {
  const stats = useMemo(() => {
    const map = new Map<string, CategoryStats>();

    categories.forEach(c => {
      map.set(c.id, { id: c.id, name: c.name, color: c.color, plannedMs: 0, actualMs: 0 });
    });

    const getCat = (id?: string) => {
      const catId = id || 'uncategorized';
      if (!map.has(catId)) {
        map.set(catId, { id: catId, name: catId === 'uncategorized' ? 'Uncategorized' : 'Unknown', color: '#555555', plannedMs: 0, actualMs: 0 });
      }
      return map.get(catId)!;
    };

    plannedBlocks.forEach(b => {
      const cat = getCat(b.categoryId);
      cat.plannedMs += (b.endTime - b.startTime);
    });

    trackedBlocks.forEach(b => {
      const cat = getCat(b.categoryId);
      cat.actualMs += (b.endTime - b.startTime);
    });

    const validStats = Array.from(map.values()).filter(s => s.plannedMs > 0 || s.actualMs > 0);
    validStats.sort((a, b) => b.actualMs - a.actualMs);

    return validStats;
  }, [plannedBlocks, trackedBlocks, categories]);

  const maxDurationMs = useMemo(() => {
    if (stats.length === 0) return 0;
    return Math.max(...stats.flatMap(s => [s.plannedMs, s.actualMs]));
  }, [stats]);

  const formatDuration = (ms: number) => {
    if (ms === 0) return '0h';
    const hours = Math.floor(Math.abs(ms) / 3600000);
    const mins = Math.floor((Math.abs(ms) % 3600000) / 60000);
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const formatDiff = (actualMs: number, plannedMs: number) => {
    const diffMs = actualMs - plannedMs;
    if (diffMs === 0) return '0h';
    const sign = diffMs > 0 ? '+' : '-';
    return `${sign}${formatDuration(Math.abs(diffMs))}`;
  };

  return (
    <div className="w-full h-full liquid-panel p-6 md:p-8 rounded-md border border-[#333] mb-6 flex flex-col">
      <h3 className="font-mono text-xs uppercase tracking-widest text-[#aaaaaa] mb-8 text-center">Plan vs Reality</h3>
      
      {stats.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-[#555] uppercase tracking-widest">No data available for today</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-4">
          {stats.map(s => {
            const diffMs = s.actualMs - s.plannedMs;
            // Overestimating time spent = yellow, underestimating/saving time = emerald
            const diffColor = diffMs > 0 ? 'text-yellow-500' : diffMs < 0 ? 'text-emerald-500' : 'text-[#888]';
            
            const plannedWidth = maxDurationMs > 0 ? (s.plannedMs / maxDurationMs) * 100 : 0;
            const actualWidth = maxDurationMs > 0 ? (s.actualMs / maxDurationMs) * 100 : 0;

            return (
              <div key={s.id} className="flex flex-col gap-3">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2">
                  <span className="font-serif text-lg tracking-wide drop-shadow-sm" style={{ color: s.color }}>{s.name}</span>
                  <div className="flex gap-4 md:gap-6 text-[10px] font-mono tracking-widest uppercase">
                    <div className="flex flex-col text-right w-16">
                      <span className="text-[#555] mb-1">Plan</span>
                      <span className="text-[#aaa] font-bold">{formatDuration(s.plannedMs)}</span>
                    </div>
                    <div className="flex flex-col text-right w-16">
                      <span className="text-[#555] mb-1">Actual</span>
                      <span className="text-white font-bold">{formatDuration(s.actualMs)}</span>
                    </div>
                    <div className="flex flex-col text-right w-16">
                      <span className="text-[#555] mb-1">Diff</span>
                      <span className={`${diffColor} font-bold`}>{formatDiff(s.actualMs, s.plannedMs)}</span>
                    </div>
                  </div>
                </div>

                {/* Bar Visualizer */}
                <div className="w-full h-1.5 relative rounded-full bg-[#111] border border-[#222]">
                  {/* Planned Track */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-[#333] z-0 rounded-full transition-all duration-1000"
                    style={{ width: `${plannedWidth}%` }}
                  />
                  {/* Actual Track */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 z-10 rounded-full transition-all duration-1000"
                    style={{ width: `${actualWidth}%`, backgroundColor: s.color }}
                  />
                  {/* Planned Target Marker */}
                  {s.plannedMs > 0 && (
                    <div 
                      className="absolute top-0 bottom-0 z-20 border-r border-white shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                      style={{ left: `calc(${plannedWidth}% - 1px)` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
