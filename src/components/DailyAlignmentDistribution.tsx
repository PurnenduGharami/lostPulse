import { useMemo } from 'react';

interface DailyAlignmentDistributionProps {
  data: { date: string; alignment: number }[];
}

export default function DailyAlignmentDistribution({ data }: DailyAlignmentDistributionProps) {
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const buckets = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    
    data.forEach(d => {
      if (d.alignment > 0) { // Only count days where some tracking happened
        if (d.alignment <= 20) counts[0]++;
        else if (d.alignment <= 40) counts[1]++;
        else if (d.alignment <= 60) counts[2]++;
        else if (d.alignment <= 80) counts[3]++;
        else counts[4]++;
      }
    });

    return [
      { label: '0-20', count: counts[0] },
      { label: '21-40', count: counts[1] },
      { label: '41-60', count: counts[2] },
      { label: '61-80', count: counts[3] },
      { label: '81-100', count: counts[4] }
    ];
  }, [data]);

  const maxCount = useMemo(() => {
    let max = 1;
    buckets.forEach(b => {
      if (b.count > max) max = b.count;
    });
    return max;
  }, [buckets]);

  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= maxCount; i += Math.max(1, Math.ceil(maxCount / 4))) {
      ticks.push(i);
    }
    return ticks;
  }, [maxCount]);

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
      <h3 className="font-serif text-white text-lg mb-1">Alignment Distribution</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Number of days in each score range
      </p>

      {data.length > 0 ? (
        <div className="w-full overflow-x-auto custom-scrollbar flex-1">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
            {/* Y-Axis */}
            {yTicks.map(tick => {
              const y = padding.top + innerHeight - (tick / maxCount) * innerHeight;
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end">{tick}</text>
                </g>
              );
            })}

            {/* Bars */}
            {buckets.map((b, i) => {
              const barWidth = Math.min((innerWidth / buckets.length) * 0.8, 80);
              const xSpacing = innerWidth / Math.max(buckets.length, 1);
              const x = padding.left + (i + 0.5) * xSpacing - barWidth / 2;
              const barHeight = (b.count / maxCount) * innerHeight;
              const y = padding.top + innerHeight - barHeight;
              
              return (
                <g key={i} className="group/bar cursor-pointer">
                  <rect 
                    x={x} 
                    y={y} 
                    width={barWidth} 
                    height={barHeight} 
                    fill="#ef4444" // red-500
                    opacity="0.8"
                    className="transition-all duration-300 group-hover/bar:opacity-100 group-hover/bar:fill-red-400"
                  />
                  <text x={x + barWidth/2} y={padding.top + innerHeight + 20} fill="#888" fontSize="10" fontFamily="monospace" textAnchor="middle">{b.label}</text>
                  <title>{`${b.label} Range\nDays: ${b.count}`}</title>
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
