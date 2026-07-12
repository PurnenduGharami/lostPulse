import { useMemo } from 'react';
import type { TimeBlock } from '../types';

interface PeakActivityHeatmapProps {
  rangeTimeBlocks: TimeBlock[];
  periodStart: Date;
  periodEnd: Date;
}

export default function PeakActivityHeatmap({ rangeTimeBlocks }: PeakActivityHeatmapProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const { matrix, maxVal } = useMemo(() => {
    // 7 days x 24 hours
    const mat = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 1;

    rangeTimeBlocks.forEach(b => {
      const d = new Date(b.startTime);
      const day = d.getDay();
      
      const startHour = d.getHours();
      const endHour = new Date(b.endTime).getHours();
      
      for (let h = startHour; h <= endHour; h++) {
        mat[day][h]++;
        if (mat[day][h] > max) max = mat[day][h];
      }
    });

    return { matrix: mat, maxVal: max };
  }, [rangeTimeBlocks]);

  const getColor = (val: number) => {
    if (val === 0) return '#111111'; // Empty
    const ratio = val / maxVal;
    if (ratio < 0.2) return '#2a0a0a'; // very dark red
    if (ratio < 0.4) return '#4d0000'; // dark red
    if (ratio < 0.6) return '#8b0000'; // red
    if (ratio < 0.8) return '#cc0000'; // red lighter
    return '#ff3333'; // brightest red
  };

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
      <h3 className="font-serif text-white text-lg mb-1">Peak Activity Hours</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        When are you most active?
      </p>

      <div className="w-full overflow-x-auto custom-scrollbar flex-1 relative">
        <div className="min-w-[600px] flex flex-col">
          {/* Header Row (Hours) */}
          <div className="flex ml-12 mb-2">
            {hours.map(h => (
              <div key={h} className="flex-1 text-center font-mono text-[10px] text-[#555]">
                {h % 4 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* Matrix Rows (Days) */}
          {days.map((dayLabel, dayIndex) => (
            <div key={dayIndex} className="flex mb-1 items-center">
              <div className="w-12 text-right pr-4 font-mono text-[10px] text-[#888] uppercase tracking-widest">
                {dayLabel}
              </div>
              {hours.map(hourIndex => {
                const val = matrix[dayIndex][hourIndex];
                return (
                  <div key={hourIndex} className="flex-1 px-[1px] relative group/cell">
                    <div 
                      className="w-full h-6 rounded-sm transition-colors duration-300 hover:border hover:border-white"
                      style={{ backgroundColor: getColor(val) }}
                    />
                    {val > 0 && (
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-32 bg-[#1a1a1c] border border-[#333] rounded-md p-2 shadow-xl opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all duration-200 z-50 pointer-events-none text-center">
                        <span className="font-mono text-xs text-white uppercase block">{dayLabel} at {hourIndex}:00</span>
                        <span className="font-mono text-[10px] text-[#888]">
                          {val} recordings
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
