import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DailyReflection } from '../types';

interface AnnualActivityHeatmapProps {
  heatmapData: Map<string, number>;
  year: number;
  dailyReflections?: Record<string, DailyReflection>;
}

export default function AnnualActivityHeatmap({ heatmapData, year }: AnnualActivityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; score: number; x: number; y: number } | null>(null);
  
  // Generate a full year grid
  const daysInYear = useMemo(() => {
    const days: { date: string, score: number, month: number, isFirstDayOfMonth: boolean }[] = [];
    let currentMonth = -1;
    
    // Calculate the start day offset (0 = Sunday, 1 = Monday...)
    const firstDay = new Date(year, 0, 1).getDay();
    // In our heatmap, let's just make it a raw 53-week linear flow for simplicity, 
    // or we pad the beginning. Let's pad it so Sunday is top row.
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: '', score: -1, month: -1, isFirstDayOfMonth: false });
    }

    const d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      
      const isFirst = d.getMonth() !== currentMonth;
      if (isFirst) currentMonth = d.getMonth();
      
      const score = heatmapData.has(dateStr) ? heatmapData.get(dateStr)! : -1;
      
      days.push({
        date: dateStr,
        score,
        month: d.getMonth(),
        isFirstDayOfMonth: isFirst
      });
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [heatmapData, year]);

  const getColor = (score: number) => {
    if (score === -1) return '#111111'; // Empty day
    if (score === 10) return '#2a0a0a'; // Active but completely unplanned/low score
    if (score < 40) return '#4d0000';
    if (score < 60) return '#8b0000';
    if (score < 80) return '#cc0000';
    return '#ff3333'; // Highest alignment
  };

  const getOpacity = (score: number) => {
    if (score === -1) return 0.3;
    if (score === 10) return 0.5;
    if (score < 40) return 0.6;
    if (score < 60) return 0.8;
    return 1;
  };

  return (
    <div className="w-full liquid-panel p-4 sm:p-6 md:p-8 rounded-md border border-[#333] mb-6 flex flex-col relative overflow-hidden group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-3">
        <div>
          <h3 className="font-serif text-white text-xl sm:text-2xl mb-1">Annual Activity Heatmap</h3>
          <p className="font-mono text-xs text-[#888] tracking-widest uppercase">
            Intentionality Score Distribution for {year}
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#555] uppercase tracking-widest">
          <span>Low Info (0)</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-[#2a0a0a]"></div>
            <div className="w-3 h-3 bg-[#4d0000]"></div>
            <div className="w-3 h-3 bg-[#8b0000]"></div>
            <div className="w-3 h-3 bg-[#cc0000]"></div>
            <div className="w-3 h-3 bg-[#ff3333]"></div>
          </div>
          <span>Optimal (100)</span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto pb-4 custom-scrollbar">
        {/* Heatmap Grid: 7 rows (days of week), ~53 columns (weeks) */}
        <div className="grid grid-rows-7 grid-flow-col gap-[3px] min-w-max">
          {daysInYear.map((day, i) => (
            <div 
              key={i} 
              className="relative"
              onMouseEnter={(e) => {
                if (!day.date) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredCell({
                  date: day.date,
                  score: day.score,
                  x: rect.left + rect.width / 2,
                  y: rect.top
                });
              }}
              onMouseLeave={() => setHoveredCell(null)}
            >
              <div
                className={`w-[11px] h-[11px] rounded-[2px] transition-colors duration-300 ${day.score === -1 ? 'hover:bg-[#333]' : 'hover:border hover:border-white'}`}
                style={{ 
                  backgroundColor: getColor(day.score),
                  opacity: getOpacity(day.score)
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Floating Tooltip */}
      {hoveredCell && createPortal(
        <div 
          className="fixed z-[9999] w-48 bg-[#1a1a1c] border border-[#333] rounded-md p-3 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: hoveredCell.x, top: hoveredCell.y - 8 }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs text-white tracking-widest">{hoveredCell.date}</span>
            <span className="font-mono text-[10px] text-[#888] uppercase">
              {hoveredCell.score === -1 ? 'No Data Recorded' : `Alignment Index: ${hoveredCell.score}`}
            </span>
          </div>
        </div>,
        document.body
      )}

      <div className="mt-4 text-center">
        <p className="font-mono text-[10px] text-[#444] uppercase tracking-widest">
          * Hover over any grid cell to view daily details.
        </p>
      </div>
    </div>
  );
}
