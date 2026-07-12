import { useMemo } from 'react';

interface PlannedVsRecordedChartProps {
  data: { date: string; plannedMs: number; trackedMs: number }[];
}

export default function PlannedVsRecordedChart({ data }: PlannedVsRecordedChartProps) {
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxMs = useMemo(() => {
    let max = 1; // prevent divide by zero
    data.forEach(d => {
      if (d.plannedMs > max) max = d.plannedMs;
      if (d.trackedMs > max) max = d.trackedMs;
    });
    return max;
  }, [data]);

  const maxHours = Math.ceil(maxMs / 3600000);

  const plannedPoints = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
      const y = padding.top + innerHeight - (d.plannedMs / (maxHours * 3600000)) * innerHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [data, innerWidth, innerHeight, padding, maxHours]);

  const trackedPoints = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
      const y = padding.top + innerHeight - (d.trackedMs / (maxHours * 3600000)) * innerHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [data, innerWidth, innerHeight, padding, maxHours]);

  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= maxHours; i += Math.max(1, Math.ceil(maxHours / 4))) {
      ticks.push(i);
    }
    return ticks;
  }, [maxHours]);

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-serif text-white text-lg mb-1">Planned vs Recorded Trend</h3>
          <p className="font-mono text-xs text-[#888] tracking-widest uppercase">
            Comparing intention with reality
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-[#4b5563]"></div>
            <span className="font-mono text-[10px] text-[#888] uppercase tracking-widest">Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-white"></div>
            <span className="font-mono text-[10px] text-white uppercase tracking-widest">Recorded</span>
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="w-full overflow-x-auto custom-scrollbar">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
            {/* Y-Axis Grid Lines */}
            {yTicks.map(tick => {
              const y = padding.top + innerHeight - (tick / maxHours) * innerHeight;
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end">{tick}h</text>
                </g>
              );
            })}

            {/* Planned Line Path */}
            <polyline 
              points={plannedPoints}
              fill="none"
              stroke="#4b5563"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="4 4"
            />

            {/* Tracked Line Path */}
            <polyline 
              points={trackedPoints}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-[#555] font-mono text-xs uppercase tracking-widest">
          No data available
        </div>
      )}
    </div>
  );
}
