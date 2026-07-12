import type { UserProfile, TimeBlock, Category, DailyReflection } from '../types';
import type { TimeRange } from './AnalyticsContainer';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import CategoryTrendsChart from './CategoryTrendsChart';
import ConsistencyTrendsChart from './ConsistencyTrendsChart';
import WeeklyAverageComparison from './WeeklyAverageComparison';
import DailyAlignmentDistribution from './DailyAlignmentDistribution';
import PeakActivityHeatmap from './PeakActivityHeatmap';
import StreakAnalysisCard from './StreakAnalysisCard';
import BestWorstDaysList from './BestWorstDaysList';

interface AnalyticsAnalysisProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  plannedBlocks: Record<string, TimeBlock[]>;
  categories: Category[];
  dailyReflections: Record<string, DailyReflection>;
  timeRange: TimeRange;
  anchorDateMs: number;
}

export default function AnalyticsAnalysis(props: AnalyticsAnalysisProps) {
  const data = useAnalyticsData(props);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ConsistencyTrendsChart data={data.dailyStats} />
        </div>
        <div className="lg:col-span-1">
          <StreakAnalysisCard data={data.dailyStats} />
        </div>
      </div>

      <section>
        <CategoryTrendsChart 
          dailyStats={data.dailyStats} 
          categories={props.categories}
          rangeTimeBlocks={data.rangeTimeBlocks}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyAverageComparison data={data.dailyStats} />
        <DailyAlignmentDistribution data={data.dailyStats} />
      </section>
      
      <section>
        <PeakActivityHeatmap rangeTimeBlocks={data.rangeTimeBlocks} periodStart={data.periodStart} periodEnd={data.periodEnd} />
      </section>

      <section>
        <BestWorstDaysList data={data.dailyStats} />
      </section>
    </div>
  );
}
