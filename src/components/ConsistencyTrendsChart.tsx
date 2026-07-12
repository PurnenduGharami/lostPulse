import { useMemo } from 'react';

interface ConsistencyTrendsChartProps {
  data: { date: string; plannedMs: number; trackedMs: number }[];
}

export default function ConsistencyTrendsChart({ data }: ConsistencyTrendsChartProps) {
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const pointsAcc = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      let acc = 0;
      if (d.plannedMs > 0) {
        acc = Math.min(d.trackedMs / d.plannedMs, 1) * 100;
      }
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
      const y = padding.top + innerHeight - (acc / 100) * innerHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [data, innerWidth, innerHeight, padding]);

  const pointsRec = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      // Treating recording consistency as % of a 16-hour waking day
      const rec = Math.min(d.trackedMs / (16 * 3600000), 1) * 100;
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
      const y = padding.top + innerHeight - (rec / 100) * innerHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [data, innerWidth, innerHeight, padding]);

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-serif text-white text-lg mb-1">Consistency Trends</h3>
          <p className="font-mono text-xs text-[#888] tracking-widest uppercase">
            Planning vs Recording Consistency
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-white"></div>
            <span className="font-mono text-[10px] text-white uppercase tracking-widest">Plan Accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-red-500"></div>
            <span className="font-mono text-[10px] text-red-500 uppercase tracking-widest">Rec Consistency</span>
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="w-full overflow-x-auto custom-scrollbar flex-1">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
            {/* Y-Axis */}
            {yTicks.map(tick => {
              const y = padding.top + innerHeight - (tick / 100) * innerHeight;
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end">{tick}%</text>
                </g>
              );
            })}

            {/* Plan Accuracy */}
            <polyline 
              points={pointsAcc}
              fill="none"
              stroke="#ffffff" // pure white
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {data.map((d, i) => {
              let acc = 0;
              if (d.plannedMs > 0) acc = Math.min(d.trackedMs / d.plannedMs, 1) * 100;
              const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
              const y = padding.top + innerHeight - (acc / 100) * innerHeight;
              return (
                <g key={`acc-${i}`} className="group/point cursor-pointer">
                  <circle cx={x} cy={y} r="3" fill="#111" stroke="#ffffff" strokeWidth="1.5" className="transition-all group-hover/point:r-[5px]" />
                  <title>{`${d.date}\nPlan Accuracy: ${acc.toFixed(0)}%`}</title>
                </g>
              );
            })}

            {/* Rec Consistency */}
            <polyline 
              points={pointsRec}
              fill="none"
              stroke="#ef4444" // red-500
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {data.map((d, i) => {
              const rec = Math.min(d.trackedMs / (16 * 3600000), 1) * 100;
              const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
              const y = padding.top + innerHeight - (rec / 100) * innerHeight;
              return (
                <g key={`rec-${i}`} className="group/point cursor-pointer">
                  <circle cx={x} cy={y} r="3" fill="#111" stroke="#ef4444" strokeWidth="1.5" className="transition-all group-hover/point:r-[5px]" />
                  <title>{`${d.date}\nRec Consistency: ${rec.toFixed(0)}%`}</title>
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
