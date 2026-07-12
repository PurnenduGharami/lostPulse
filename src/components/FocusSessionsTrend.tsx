import { useMemo } from 'react';

interface FocusSessionsTrendProps {
  data: { date: string; focusSessions: number }[];
}

export default function FocusSessionsTrend({ data }: FocusSessionsTrendProps) {
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxSessions = useMemo(() => {
    let max = 1;
    data.forEach(d => {
      if (d.focusSessions > max) max = d.focusSessions;
    });
    return max;
  }, [data]);

  const yTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i <= maxSessions; i += Math.max(1, Math.ceil(maxSessions / 4))) {
      ticks.push(i);
    }
    return ticks;
  }, [maxSessions]);

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden">
      <h3 className="font-serif text-white text-lg mb-1">Focus Sessions Trend</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Daily deep work periods
      </p>

      {data.length > 0 ? (
        <div className="w-full overflow-x-auto custom-scrollbar">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px] overflow-visible">
            {/* Y-Axis Grid Lines */}
            {yTicks.map(tick => {
              const y = padding.top + innerHeight - (tick / maxSessions) * innerHeight;
              return (
                <g key={tick}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#333" strokeDasharray="4 4" strokeWidth="1" />
                  <text x={padding.left - 10} y={y + 4} fill="#666" fontSize="10" fontFamily="monospace" textAnchor="end">{tick}</text>
                </g>
              );
            })}

            {/* Bars */}
            {data.map((d, i) => {
              const barWidth = Math.min((innerWidth / data.length) * 0.6, 20); // max width 20
              const xSpacing = innerWidth / Math.max(data.length, 1);
              const x = padding.left + (i + 0.5) * xSpacing - barWidth / 2;
              const barHeight = (d.focusSessions / maxSessions) * innerHeight;
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
                    rx="2"
                  />
                  <title>{`${d.date}\nFocus Sessions: ${d.focusSessions}`}</title>
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
