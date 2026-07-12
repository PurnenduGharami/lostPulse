import type { TimeBlock, Category, UserProfile } from '../types';
import DayComparisonHero from './DayComparisonHero';
import DaySummaryStats from './DaySummaryStats';
import AlignmentIndexCard from './AlignmentIndexCard';
import PlanVsRealityCard from './PlanVsRealityCard';


interface DailyReportOverviewProps {
  userProfile: UserProfile;
  plannedBlocks: TimeBlock[];
  trackedBlocks: TimeBlock[];
  categories: Category[];
  baseDateMs: number;
  reflection?: any;
}

export default function DailyReportOverview({
  plannedBlocks,
  trackedBlocks,
  categories,
  baseDateMs,
  reflection
}: DailyReportOverviewProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="w-full">
        <DayComparisonHero 
          plannedBlocks={plannedBlocks} 
          trackedBlocks={trackedBlocks} 
          categories={categories}
          baseDateMs={baseDateMs} 
        />
      </div>

      <div className="w-full">
        <DaySummaryStats 
          plannedBlocks={plannedBlocks} 
          trackedBlocks={trackedBlocks} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AlignmentIndexCard 
          plannedBlocks={plannedBlocks} 
          trackedBlocks={trackedBlocks}
          reflection={reflection} 
        />
        <PlanVsRealityCard 
          plannedBlocks={plannedBlocks}
          trackedBlocks={trackedBlocks} 
          categories={categories} 
        />
      </div>

      <div className="w-full liquid-panel p-6 sm:p-10 rounded-md border border-red-900/30 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-red-950/10 pointer-events-none" />
        <h2 className="font-cinzel text-3xl md:text-4xl text-white font-bold tracking-widest mb-2 relative z-10">
          {new Date(baseDateMs).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} HAS PASSED
        </h2>
        <p className="font-mono text-sm text-red-500 uppercase tracking-widest relative z-10 mb-2">You Have Lost One Day</p>
        <p className="font-mono text-xs text-[#666] max-w-md mx-auto relative z-10">
          This time is permanently gone from your life. Review your alignment above and plan carefully for tomorrow.
        </p>
      </div>
    </div>
  );
}
