import type { TimeBlock, Category } from '../types';

interface PriorityDistributionBarProps {
  plannedBlocks: TimeBlock[];
  trackedBlocks: TimeBlock[];
  categories: Category[];
}

export default function PriorityDistributionBar({ plannedBlocks, trackedBlocks, categories }: PriorityDistributionBarProps) {
  // Aggregate times by category
  const plannedMap: Record<string, number> = {};
  const trackedMap: Record<string, number> = {};

  let totalPlanned = 0;
  let totalTracked = 0;

  plannedBlocks.forEach(b => {
    const cat = b.categoryId || 'uncategorized';
    const dur = b.endTime - b.startTime;
    plannedMap[cat] = (plannedMap[cat] || 0) + dur;
    totalPlanned += dur;
  });

  trackedBlocks.forEach(b => {
    const cat = b.categoryId || 'uncategorized';
    const dur = b.endTime - b.startTime;
    trackedMap[cat] = (trackedMap[cat] || 0) + dur;
    totalTracked += dur;
  });

  const getCategoryColor = (categoryId: string) => {
    if (categoryId === 'uncategorized') return '#555555';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.color : '#555555';
  };

  const getCategoryName = (categoryId: string) => {
    if (categoryId === 'uncategorized') return 'Uncategorized';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  // Build sorted bars
  const allCats = Array.from(new Set([...Object.keys(plannedMap), ...Object.keys(trackedMap)]));
  
  // Sort by planned time mostly, then tracked
  allCats.sort((a, b) => (plannedMap[b] || 0) - (plannedMap[a] || 0) || (trackedMap[b] || 0) - (trackedMap[a] || 0));

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#333] mb-6">
      <h3 className="font-serif text-white text-lg mb-6">Priority Distribution</h3>

      <div className="space-y-6">
        {allCats.map(cat => {
          const planned = plannedMap[cat] || 0;
          const tracked = trackedMap[cat] || 0;
          
          const maxTime = Math.max(totalPlanned, totalTracked, 1);
          const plannedPct = (planned / maxTime) * 100;
          const trackedPct = (tracked / maxTime) * 100;
          
          const color = getCategoryColor(cat);
          const name = getCategoryName(cat);

          const formatHours = (ms: number) => (ms / 3600000).toFixed(1) + 'h';

          return (
            <div key={cat} className="w-full">
              <div className="flex justify-between items-end mb-1">
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color }}>{name}</span>
                <span className="font-mono text-[10px] text-[#aaaaaa]">
                  Plan: {formatHours(planned)} | Act: {formatHours(tracked)}
                </span>
              </div>
              
              <div className="w-full h-1 bg-[#111] rounded-full overflow-hidden mb-1 relative">
                <div 
                  className="absolute top-0 left-0 h-full opacity-30" 
                  style={{ width: `${plannedPct}%`, backgroundColor: color }}
                />
                <div 
                  className="absolute top-0 left-0 h-full" 
                  style={{ width: `${trackedPct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}

        {allCats.length === 0 && (
          <div className="text-center text-[#555] font-mono text-xs uppercase tracking-widest py-4">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}
