import type { TimeBlock, Category, DailyReflection } from '../types';
import PriorityDistributionBar from './PriorityDistributionBar';
import ActivityTimelineStory from './ActivityTimelineStory';
import FinalReflectionCard from './FinalReflectionCard';

interface DailyReportInsightsProps {
  dateStr: string;
  plannedBlocks: TimeBlock[];
  trackedBlocks: TimeBlock[];
  categories: Category[];
  reflection?: DailyReflection;
  onSaveReflection: (dateStr: string, reflection: DailyReflection) => void;
}

export default function DailyReportInsights({
  dateStr,
  plannedBlocks,
  trackedBlocks,
  categories,
  reflection,
  onSaveReflection
}: DailyReportInsightsProps) {
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 pb-8 animate-fade-in items-stretch">
      {/* Left Column - Scrollable internally, height dictated by right column */}
      <div className="relative w-full h-[600px] lg:h-auto">
        <div className="lg:absolute lg:inset-0 lg:overflow-y-auto custom-scrollbar lg:pr-4 h-full">
          <ActivityTimelineStory 
            plannedBlocks={plannedBlocks} 
            trackedBlocks={trackedBlocks} 
            categories={categories} 
          />
        </div>
      </div>

      {/* Right Column - Dictates height */}
      <div className="flex flex-col gap-6 w-full h-fit">
        <PriorityDistributionBar 
          plannedBlocks={plannedBlocks} 
          trackedBlocks={trackedBlocks} 
          categories={categories} 
        />
        
        <div className="w-full">
          <FinalReflectionCard 
            dateStr={dateStr}
            reflection={reflection}
            onSaveReflection={onSaveReflection}
          />
        </div>
      </div>
    </div>
  );
}
