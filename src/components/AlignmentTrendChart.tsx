import { useMemo } from 'react';

interface AlignmentTrendChartProps {
  data: { date: string; alignment: number; trackedMs: number; hasReflection: boolean }[];
}

export default function AlignmentTrendChart({ data }: AlignmentTrendChartProps) {
  // SVG Dimensions
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (data.length === 0) return '';
    
    return data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
      // Y goes from bottom (0) to top (100)
      const y = padding.top + innerHeight - (d.alignment / 100) * innerHeight;
      return `${x},${y}`;
    }).join(' ');
  }, [data, innerWidth, innerHeight, padding]);

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden">
      <h3 className="font-serif text-white text-lg mb-1">Alignment Trend</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Intentionality Score over selected period
      </p>

      {data.length > 0 ? (
        <div className="w-full overflow-x-auto custom-scrollbar">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
            {/* Y-Axis Grid Lines */}
            {yTicks.map(tick => {
              const y = padding.top + innerHeight - (tick / 100) * innerHeight;
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end">{tick}</text>
                </g>
              );
            })}

            {/* Line Path */}
            <polyline 
              points={points}
              fill="none"
              stroke="#ef4444" // red-500
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Area Path */}
            <polygon
              points={`${padding.left},${padding.top + innerHeight} ${points} ${width - padding.right},${padding.top + innerHeight}`}
              fill="url(#gradient-red)"
              opacity="0.2"
            />

            <defs>
              <linearGradient id="gradient-red" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Data Points */}
            {data.map((d, i) => {
              const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
              const y = padding.top + innerHeight - (d.alignment / 100) * innerHeight;
              
              return (
                <g key={i} className="group/point cursor-pointer">
                  <circle cx={x} cy={y} r="4" fill="#111" stroke="#ef4444" strokeWidth="2" className="transition-all group-hover/point:r-[6px]" />
                  {/* Tooltip handled via simple title for now, could be HTML overlay */}
                  <title>{`${d.date}\nAlignment: ${d.alignment}%`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center text-[#555] font-mono text-xs uppercase tracking-widest">
          No data available for this period
        </div>
      )}
    </div>
  );
}
