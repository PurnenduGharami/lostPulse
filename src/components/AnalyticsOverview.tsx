
import type { UserProfile, TimeBlock, Category, DailyReflection } from '../types';
import type { TimeRange } from './AnalyticsContainer';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import AnnualActivityHeatmap from './AnnualActivityHeatmap';
import AlignmentTrendChart from './AlignmentTrendChart';
import PlannedVsRecordedChart from './PlannedVsRecordedChart';
import CategoryDistributionChart from './CategoryDistributionChart';
import UnmarkedTimeTrend from './UnmarkedTimeTrend';
import FocusSessionsTrend from './FocusSessionsTrend';
import TopCategoriesProgress from './TopCategoriesProgress';

interface AnalyticsOverviewProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  plannedBlocks: Record<string, TimeBlock[]>;
  categories: Category[];
  dailyReflections: Record<string, DailyReflection>;
  timeRange: TimeRange;
  anchorDateMs: number;
  goals: Record<string, string>;
  saveGoal: (key: string, value: string) => Promise<void>;
  getPeriodLabel: () => string;
}

export default function AnalyticsOverview(props: AnalyticsOverviewProps) {
  const data = useAnalyticsData(props);

  const formatHours = (ms: number) => {
    return (ms / 3600000).toFixed(1) + 'h';
  };

  const statCards = [
    { label: 'Average Alignment', value: `${data.avgAlignment}%`, highlight: true },
    { label: 'Total Recorded', value: formatHours(data.totalRecordedMs) },
    { label: 'Total Planned', value: formatHours(data.totalPlannedMs) },
    { label: 'Focus Sessions', value: data.totalFocusSessions },
    { label: 'Best Day', value: data.bestDay ? data.bestDay.date : 'N/A' },
    { label: 'Worst Day', value: data.worstDay ? data.worstDay.date : 'N/A' },
  ];

  const year = new Date(props.anchorDateMs).getFullYear();

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-4">
        <AnnualActivityHeatmap heatmapData={data.heatmapData} year={year} dailyReflections={props.dailyReflections} />
        
        {/* Goal Input Based on Time Range */}
        {(props.timeRange === 'weekly' || props.timeRange === 'monthly') && (
          <div className="w-full flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300 px-1">
            <span className="font-mono text-xs text-[#888] uppercase whitespace-nowrap">
              {props.timeRange === 'weekly' ? 'Weekly' : 'Monthly'} Goal:
            </span>
            <input
              type="text"
              placeholder={`Set your main focus for this ${props.timeRange === 'weekly' ? 'week' : 'month'}...`}
              value={props.goals[`${props.timeRange}-${props.getPeriodLabel()}`] || ''}
              onChange={(e) => props.saveGoal(`${props.timeRange}-${props.getPeriodLabel()}`, e.target.value)}
              className="flex-1 bg-black/40 border border-[#333] px-3 py-1.5 rounded-sm font-mono text-xs text-white focus:outline-none focus:border-[#666] focus:bg-[#111] transition-all"
            />
          </div>
        )}
      </div>

      <section>
        <h3 className="font-cinzel text-xl text-white mb-6 uppercase tracking-widest border-b border-[#333] pb-2">Period Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, i) => (
            <div key={i} className="liquid-panel p-4 rounded-md border border-[#222] flex flex-col justify-center items-center text-center group hover:border-[#444] transition-colors">
              <span className="font-mono text-[10px] text-[#888] uppercase tracking-widest mb-2">{stat.label}</span>
              <span className={`font-mono text-xl md:text-2xl ${stat.highlight ? 'text-red-500' : 'text-white'}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlignmentTrendChart data={data.dailyStats} />
        <PlannedVsRecordedChart data={data.dailyStats} />
      </section>

      <section>
        <CategoryDistributionChart data={data.categoryDistribution} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <UnmarkedTimeTrend data={data.dailyStats} />
          <FocusSessionsTrend data={data.dailyStats} />
        </div>
        <div className="lg:col-span-1">
          <TopCategoriesProgress data={data.categoryDistribution} />
        </div>
      </section>
    </div>
  );
}
