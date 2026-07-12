import { useMemo } from 'react';
import type { TimeBlock, Category } from '../types';

interface CategoryTrendsChartProps {
  dailyStats: { date: string }[];
  categories: Category[];
  rangeTimeBlocks: TimeBlock[];
}

export default function CategoryTrendsChart({ dailyStats, categories, rangeTimeBlocks }: CategoryTrendsChartProps) {
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 120, bottom: 30, left: 40 };
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Find top 4 categories in this period
  const topCategories = useMemo(() => {
    const catMap = new Map<string, number>();
    rangeTimeBlocks.forEach(b => {
      const cid = b.categoryId || 'uncategorized';
      catMap.set(cid, (catMap.get(cid) || 0) + (b.endTime - b.startTime));
    });
    
    return Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => {
        const cat = categories.find(c => c.id === entry[0]) || categories.find(c => c.id === 'uncategorized')!;
        return cat;
      });
  }, [rangeTimeBlocks, categories]);

  const { pointsData, maxHours } = useMemo(() => {
    if (dailyStats.length === 0 || topCategories.length === 0) return { pointsData: [], maxHours: 1 };

    let maxMs = 0;
    
    // Aggregate by day
    const dayMap = new Map<string, Map<string, number>>();
    dailyStats.forEach(d => {
      dayMap.set(d.date, new Map<string, number>());
      topCategories.forEach(c => dayMap.get(d.date)!.set(c.id, 0));
    });

    rangeTimeBlocks.forEach(b => {
      const d = new Date(b.startTime);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const cid = b.categoryId || 'uncategorized';
      if (dayMap.has(dateStr) && dayMap.get(dateStr)!.has(cid)) {
        const ms = b.endTime - b.startTime;
        dayMap.get(dateStr)!.set(cid, dayMap.get(dateStr)!.get(cid)! + ms);
      }
    });

    const dataArr = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    const pointsData = topCategories.map(cat => {
      const points = dataArr.map((entry, i) => {
        const ms = entry[1].get(cat.id)!;
        if (ms > maxMs) maxMs = ms;
        const x = padding.left + (i / Math.max(dataArr.length - 1, 1)) * innerWidth;
        return { x, ms };
      });
      return { cat, points };
    });

    return { pointsData, maxHours: Math.ceil(maxMs / 3600000) };
  }, [dailyStats, topCategories, rangeTimeBlocks, innerWidth, padding]);

  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= maxHours; i += Math.max(1, Math.ceil(maxHours / 4))) {
      ticks.push(i);
    }
    return ticks;
  }, [maxHours]);

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
      <h3 className="font-serif text-white text-lg mb-1">Category Trends</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Daily time spent in top 4 categories
      </p>

      {pointsData.length > 0 ? (
        <div className="w-full overflow-x-auto custom-scrollbar flex-1 relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
            {/* Y-Axis */}
            {yTicks.map(tick => {
              const y = padding.top + innerHeight - (tick / maxHours) * innerHeight;
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end">{tick}h</text>
                </g>
              );
            })}

            {/* Lines */}
            {pointsData.map((pd, index) => {
              const pointsStr = pd.points.map(p => {
                const y = padding.top + innerHeight - (p.ms / (maxHours * 3600000)) * innerHeight;
                return `${p.x},${y}`;
              }).join(' ');
              
              const lastY = pd.points.length > 0 
                ? padding.top + innerHeight - (pd.points[pd.points.length-1].ms / (maxHours * 3600000)) * innerHeight 
                : 0;

              return (
                <g key={index}>
                  <polyline 
                    points={pointsStr}
                    fill="none"
                    stroke={pd.cat.color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {/* Legend Label at end of line */}
                  <text 
                    x={width - padding.right + 10} 
                    y={lastY + 4} 
                    fill={pd.cat.color} 
                    fontSize="11" 
                    fontFamily="monospace" 
                    className="uppercase tracking-widest"
                  >
                    {pd.cat.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#555] font-mono text-xs uppercase tracking-widest">
          No data available
        </div>
      )}
    </div>
  );
}
