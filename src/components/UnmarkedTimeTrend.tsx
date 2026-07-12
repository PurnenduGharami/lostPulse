import { useMemo } from 'react';

interface UnmarkedTimeTrendProps {
  data: { date: string; trackedMs: number }[];
}

export default function UnmarkedTimeTrend({ data }: UnmarkedTimeTrendProps) {
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const totalDayMs = 24 * 3600000;

  const points = useMemo(() => {
    if (data.length === 0) return '';
    return data.map((d, i) => {
      const unmarkedMs = Math.max(0, totalDayMs - d.trackedMs);
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
      const y = padding.top + innerHeight - (unmarkedMs / totalDayMs) * innerHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [data, innerWidth, innerHeight, padding, totalDayMs]);

  const yTicks = [0, 6, 12, 18, 24];

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden">
      <h3 className="font-serif text-white text-lg mb-1">Unmarked Time Trend</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Daily unallocated hours
      </p>

      {data.length > 0 ? (
        <div className="w-full overflow-x-auto custom-scrollbar">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
            {/* Y-Axis Grid Lines */}
            {yTicks.map(tick => {
              const y = padding.top + innerHeight - (tick / 24) * innerHeight;
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end">{tick}h</text>
                </g>
              );
            })}

            {/* Line Path */}
            <polyline 
              points={points}
              fill="none"
              stroke="#9ca3af" // gray-400
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Area Path */}
            <polygon
              points={`${padding.left},${padding.top + innerHeight} ${points} ${width - padding.right},${padding.top + innerHeight}`}
              fill="url(#gradient-gray)"
              opacity="0.3"
            />

            <defs>
              <linearGradient id="gradient-gray" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9ca3af" stopOpacity="1" />
                <stop offset="100%" stopColor="#9ca3af" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Data Points */}
            {data.map((d, i) => {
              const unmarkedMs = Math.max(0, totalDayMs - d.trackedMs);
              const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
              const y = padding.top + innerHeight - (unmarkedMs / totalDayMs) * innerHeight;
              
              return (
                <g key={i} className="group/point cursor-pointer">
                  <circle cx={x} cy={y} r="3" fill="#111" stroke="#9ca3af" strokeWidth="2" className="transition-all group-hover/point:r-[5px]" />
                  <title>{`${d.date}\nUnmarked: ${(unmarkedMs / 3600000).toFixed(1)}h`}</title>
                </g>
              );
            })}
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
