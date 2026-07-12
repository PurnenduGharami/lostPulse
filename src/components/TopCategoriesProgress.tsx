import type { Category } from '../types';

interface TopCategoriesProgressProps {
  data: { ms: number; category: Category }[];
}

export default function TopCategoriesProgress({ data }: TopCategoriesProgressProps) {
  const topCategories = data.slice(0, 5);
  const maxMs = topCategories.length > 0 ? topCategories[0].ms : 1;

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#222] group hover:border-[#444] transition-colors flex flex-col relative overflow-hidden h-full">
      <h3 className="font-serif text-white text-lg mb-1">Top Categories</h3>
      <p className="font-mono text-xs text-[#888] tracking-widest uppercase mb-6">
        Highest volume time sinks
      </p>

      {topCategories.length > 0 ? (
        <div className="flex flex-col gap-5 flex-1 justify-center">
          {topCategories.map((d, i) => {
            const widthPct = (d.ms / maxMs) * 100;
            return (
              <div key={i} className="flex flex-col gap-2 group/cat cursor-pointer">
                <div className="flex justify-between items-end">
                  <span className="font-mono text-xs text-white uppercase tracking-widest">{d.category.name}</span>
                  <span className="font-mono text-[10px] text-[#888]">{(d.ms / 3600000).toFixed(1)}h</span>
                </div>
                <div className="w-full h-2 bg-[#111] rounded-sm overflow-hidden border border-[#222]">
                  <div 
                    className="h-full rounded-sm transition-all duration-500 ease-out"
                    style={{ 
                      width: `${widthPct}%`, 
                      backgroundColor: d.category.color,
                      opacity: 0.8
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#555] font-mono text-xs uppercase tracking-widest">
          No data available
        </div>
      )}
    </div>
  );
}
