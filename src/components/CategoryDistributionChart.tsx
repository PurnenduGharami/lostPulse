import type { Category } from '../types';

interface CategoryDistributionChartProps {
  data: { ms: number; category: Category }[];
}

export default function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  const totalMs = data.reduce((acc, d) => acc + d.ms, 0);

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden">
      <h3 className="font-serif text-white text-lg mb-1">Category Distribution</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Total time allocation
      </p>

      {totalMs > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="w-full h-8 flex rounded-sm overflow-hidden">
            {data.map((d, i) => {
              const widthPct = (d.ms / totalMs) * 100;
              if (widthPct < 0.1) return null;
              return (
                <div 
                  key={i}
                  style={{ width: `${widthPct}%`, backgroundColor: d.category.color }}
                  className="h-full group/bar cursor-pointer border-r border-[#111] last:border-r-0 relative"
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-32 bg-[#1a1a1c] border border-[#333] rounded-md p-2 shadow-xl opacity-0 invisible group-hover/bar:opacity-100 group-hover/bar:visible transition-all duration-200 z-50 pointer-events-none text-center">
                    <span className="font-mono text-xs text-white uppercase block mb-1">{d.category.name}</span>
                    <span className="font-mono text-[10px] text-[#888]">
                      {(d.ms / 3600000).toFixed(1)}h ({widthPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-2">
            {data.slice(0, 5).map((d, i) => {
              const widthPct = (d.ms / totalMs) * 100;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.category.color }}></div>
                  <span className="font-mono text-xs text-[#ccc] uppercase">
                    {d.category.name} ({widthPct.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center text-[#555] font-mono text-xs uppercase tracking-widest">
          No data available
        </div>
      )}
    </div>
  );
}
