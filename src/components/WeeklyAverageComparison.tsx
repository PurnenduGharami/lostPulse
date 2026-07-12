import { useMemo } from 'react';

interface WeeklyAverageComparisonProps {
  data: { date: string; alignment: number }[];
}

export default function WeeklyAverageComparison({ data }: WeeklyAverageComparisonProps) {
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const weeklyData = useMemo(() => {
    if (data.length === 0) return [];
    
    // Group into 7-day chunks roughly
    const chunks: { label: string; score: number }[] = [];
    let currentSum = 0;
    let currentCount = 0;
    let weekIndex = 1;

    data.forEach((d, i) => {
      if (d.alignment > 0) {
        currentSum += d.alignment;
        currentCount++;
      }
      
      if ((i + 1) % 7 === 0 || i === data.length - 1) {
        if (currentCount > 0) {
          chunks.push({
            label: `W${weekIndex}`,
            score: Math.round(currentSum / currentCount)
          });
        }
        currentSum = 0;
        currentCount = 0;
        weekIndex++;
      }
    });

    // Only show last 10 weeks to keep it readable
    return chunks.slice(-10);
  }, [data]);

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
      <h3 className="font-serif text-white text-lg mb-1">Weekly Averages</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Average alignment per week
      </p>

      {weeklyData.length > 0 ? (
        <div className="w-full overflow-x-auto custom-scrollbar flex-1">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
            {/* Y-Axis */}
            {yTicks.map(tick => {
              const y = padding.top + innerHeight - (tick / 100) * innerHeight;
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end">{tick}</text>
                </g>
              );
            })}

            {/* Bars */}
            {weeklyData.map((d, i) => {
              const barWidth = Math.min((innerWidth / weeklyData.length) * 0.4, 40);
              const xSpacing = innerWidth / Math.max(weeklyData.length, 1);
              const x = padding.left + (i + 0.5) * xSpacing - barWidth / 2;
              const barHeight = (d.score / 100) * innerHeight;
              const y = padding.top + innerHeight - barHeight;
              
              return (
                <g key={i} className="group/bar cursor-pointer">
                  <rect 
                    x={x} 
                    y={y} 
                    width={barWidth} 
                    height={barHeight} 
                    fill="#ffffff" // pure white
                    opacity="0.8"
                    className="transition-all duration-300 group-hover/bar:opacity-100 group-hover/bar:fill-white"
                    rx="2"
                  />
                  <text x={x + barWidth/2} y={padding.top + innerHeight + 20} fill="#888" fontSize="10" fontFamily="monospace" textAnchor="middle">{d.label}</text>
                  <title>{`${d.label}\nAverage: ${d.score}%`}</title>
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
