import type { TimeBlock, Category } from '../types';
import { formatTimeString } from '../utils';

interface DayComparisonHeroProps {
  plannedBlocks: TimeBlock[];
  trackedBlocks: TimeBlock[];
  categories: Category[];
  baseDateMs: number;
}

export default function DayComparisonHero({
  plannedBlocks,
  trackedBlocks,
  categories,
  baseDateMs
}: DayComparisonHeroProps) {
  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '#555555';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.color : '#555555';
  };
  
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Uncategorized';
  };

  const dayEndMs = baseDateMs + 24 * 3600000;
  const msInDay = 24 * 3600000;

  const renderBlocks = (blocks: TimeBlock[], type: 'planned' | 'recorded') => {
    return blocks.map(block => {
      const startMs = Math.max(baseDateMs, block.startTime);
      const endMs = Math.min(dayEndMs, block.endTime);
      if (endMs <= startMs) return null;

      const leftPercent = ((startMs - baseDateMs) / msInDay) * 100;
      const widthPercent = ((endMs - startMs) / msInDay) * 100;
      
      const color = getCategoryColor(block.categoryId);
      
      const isPlanned = type === 'planned';
      const bgColor = isPlanned ? `${color}33` : color;
      const borderStyle = isPlanned ? `1px solid ${color}` : 'none';

      const durMs = block.endTime - block.startTime;
      const durHours = Math.floor(durMs / 3600000);
      const durMins = Math.floor((durMs % 3600000) / 60000);
      const durStr = `${durHours > 0 ? durHours + 'h ' : ''}${durMins}m`.trim();

      const tooltipLines = [
        block.title || 'Untitled',
        `${formatTimeString(block.startTime)} - ${formatTimeString(block.endTime)}`,
        `Duration: ${durStr}`,
        `Category: ${getCategoryName(block.categoryId)}`
      ];

      return (
        <div
          key={block.id}
          onDoubleClick={() => {
            window.dispatchEvent(new CustomEvent('open-edit-block', { detail: { blockId: block.id, source: isPlanned ? 'planner' : 'tracker' } }));
          }}
          className="absolute h-full rounded-sm flex items-center justify-center overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/50 transition-all z-10 hover:z-20 group"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: bgColor,
            border: borderStyle
          }}
        >
          {widthPercent >= 3 && (
            <span className="font-mono text-[9px] text-white/90 truncate px-1 drop-shadow-md select-none pointer-events-none">
              {block.title}
            </span>
          )}

          {/* Custom Hover Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/90 border border-[#333] rounded p-2 z-[100] w-max max-w-[200px]">
            {tooltipLines.map((line, i) => (
              <div key={i} className={`font-mono text-[9px] ${i === 0 ? 'text-white mb-1 font-bold' : 'text-[#aaa]'}`}>
                {line}
              </div>
            ))}
            <div className="mt-1 pt-1 border-t border-[#333] text-emerald-400 font-mono text-[8px] uppercase tracking-widest">
              Double click to edit
            </div>
          </div>
        </div>
      );
    });
  };

  // Hour markers
  const markers = [];
  for (let i = 0; i <= 24; i += 3) {
    markers.push(
      <div 
        key={i} 
        className="absolute h-full border-l border-white/5 flex flex-col justify-end pb-1 pl-1"
        style={{ left: `${(i / 24) * 100}%` }}
      >
        <span className="text-[8px] font-mono text-[#555]">{i === 0 ? '12AM' : i === 12 ? '12PM' : i > 12 ? `${i-12}PM` : `${i}AM`}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full liquid-panel p-4 sm:p-6 rounded-md border border-[#333] flex flex-col justify-center">
      <h2 className="font-serif text-white text-lg mb-4 sm:mb-6">Day Comparison</h2>
      
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="relative w-full min-w-[500px] h-20 flex flex-col justify-center">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {markers}
        </div>

        <div className="relative z-10 w-full flex flex-col gap-1">
          {/* Planned Track */}
          <div className="flex items-center w-full h-8 relative">
            <div className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#aaaaaa]">Planned</div>
            <div className="flex-1 h-full bg-[#111] rounded-sm relative overflow-visible">
              {renderBlocks(plannedBlocks, 'planned')}
            </div>
          </div>
          
          {/* Recorded Track */}
          <div className="flex items-center w-full h-8 relative mt-1">
            <div className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#aaaaaa]">Recorded</div>
            <div className="flex-1 h-full bg-[#111] rounded-sm relative overflow-visible">
              {renderBlocks(trackedBlocks, 'recorded')}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
