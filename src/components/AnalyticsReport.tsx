import { useMemo } from 'react';
import type { UserProfile, TimeBlock, Category, DailyReflection } from '../types';
import type { TimeRange } from './AnalyticsContainer';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import AlignmentTrendChart from './AlignmentTrendChart';
import CategoryDistributionChart from './CategoryDistributionChart';

interface AnalyticsReportProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  plannedBlocks: Record<string, TimeBlock[]>;
  categories: Category[];
  dailyReflections: Record<string, DailyReflection>;
  timeRange: TimeRange;
  anchorDateMs: number;
}

export default function AnalyticsReport(props: AnalyticsReportProps) {
  const data = useAnalyticsData(props);

  const formatHours = (ms: number) => (ms / 3600000).toFixed(1) + 'h';

  const {
    mostProductiveCat,
    leastUsedCat,
    planningAccuracy,
    recordingAccuracy,
    insights,
    recommendations
  } = useMemo(() => {
    let mostProd = 'N/A';
    let leastUsed = 'N/A';
    if (data.categoryDistribution.length > 0) {
      mostProd = data.categoryDistribution[0].category.name;
      leastUsed = data.categoryDistribution[data.categoryDistribution.length - 1].category.name;
    }

    const daysCount = data.dailyStats.length || 1;
    let accSum = 0;
    let recSum = 0;
    let weekendMs = 0;
    let weekdayMs = 0;

    data.dailyStats.forEach(d => {
      if (d.plannedMs > 0) {
        accSum += Math.min(d.trackedMs / d.plannedMs, 1) * 100;
      }
      recSum += Math.min(d.trackedMs / (16 * 3600000), 1) * 100;
      
      const dayOfWeek = new Date(d.date).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) weekendMs += d.trackedMs;
      else weekdayMs += d.trackedMs;
    });

    const pAcc = Math.round(accSum / daysCount);
    const rAcc = Math.round(recSum / daysCount);

    const generatedInsights = [];
    const generatedRecs = [];

    if (weekendMs / 2 > weekdayMs / 5) {
      generatedInsights.push("You record significantly more time on weekends compared to weekdays.");
      generatedRecs.push("Consider distributing your focus more evenly across the week to avoid weekend burnout.");
    } else {
      generatedInsights.push("Your weekdays are highly active compared to your weekends.");
      generatedRecs.push("Ensure you are taking proper time off during the weekend to recover.");
    }

    if (pAcc > 80) {
      generatedInsights.push(`Planning accuracy is excellent at ${pAcc}%.`);
      generatedRecs.push("You have mastered estimating your time. Consider taking on slightly more ambitious daily goals.");
    } else if (pAcc < 50) {
      generatedInsights.push(`Planning accuracy is low at ${pAcc}%.`);
      generatedRecs.push("You are consistently overestimating what you can achieve. Try planning 20% less each day.");
    }

    if (data.categoryDistribution.length > 0) {
      const topCat = data.categoryDistribution[0];
      const topCatPct = Math.round((topCat.ms / data.totalRecordedMs) * 100);
      generatedInsights.push(`${topCat.category.name} accounted for ${topCatPct}% of all recorded time.`);
      
      if (topCatPct > 60) {
        generatedRecs.push(`Your life is heavily skewed towards ${topCat.category.name}. Check if other important areas are being neglected.`);
      }
    }

    return {
      mostProductiveCat: mostProd,
      leastUsedCat: leastUsed,
      planningAccuracy: pAcc,
      recordingAccuracy: rAcc,
      insights: generatedInsights,
      recommendations: generatedRecs
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto">
      
      <div className="w-full liquid-panel p-8 rounded-md border border-[#222]">
        <h2 className="font-cinzel text-3xl text-white mb-2 uppercase tracking-widest text-center">Executive Summary</h2>
        <p className="font-mono text-xs text-[#888] tracking-widest uppercase text-center mb-8">
          {data.periodStart.toLocaleDateString()} — {data.periodEnd.toLocaleDateString()}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-mono text-sm text-[#ccc] uppercase tracking-widest border-b border-[#333] pb-2 mb-4">Highlights</h3>
            <ul className="space-y-4">
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Best Day</span>
                <span className="font-mono text-sm text-white">{data.bestDay?.date || 'N/A'} ({data.bestDay?.alignment || 0}%)</span>
              </li>
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Worst Day</span>
                <span className="font-mono text-sm text-red-500">{data.worstDay?.date || 'N/A'} ({data.worstDay?.alignment || 0}%)</span>
              </li>
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Most Productive Category</span>
                <span className="font-mono text-sm text-white">{mostProductiveCat}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Least Used Category</span>
                <span className="font-mono text-sm text-[#666]">{leastUsedCat}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-sm text-[#ccc] uppercase tracking-widest border-b border-[#333] pb-2 mb-4">Averages & Totals</h3>
            <ul className="space-y-4">
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Average Alignment</span>
                <span className="font-mono text-sm text-white">{data.avgAlignment}%</span>
              </li>
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Average Planned/Day</span>
                <span className="font-mono text-sm text-white">{formatHours(data.totalPlannedMs / Math.max(data.dailyStats.length, 1))}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Average Recorded/Day</span>
                <span className="font-mono text-sm text-white">{formatHours(data.totalRecordedMs / Math.max(data.dailyStats.length, 1))}</span>
              </li>
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Planning Accuracy</span>
                <span className="font-mono text-sm text-white">{planningAccuracy}%</span>
              </li>
              <li className="flex justify-between">
                <span className="font-mono text-xs text-[#888] uppercase">Recording Accuracy</span>
                <span className="font-mono text-sm text-red-500">{recordingAccuracy}%</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-mono text-sm text-[#ccc] uppercase tracking-widest border-b border-[#333] pb-2 mb-4">Key Insights</h3>
            <ul className="space-y-3 list-disc list-inside text-[#bbb] font-sans text-sm leading-relaxed">
              {insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-sm text-[#ccc] uppercase tracking-widest border-b border-[#333] pb-2 mb-4">Recommendations</h3>
            <ul className="space-y-3 list-disc list-inside text-white font-sans text-sm leading-relaxed">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="font-mono text-sm text-[#ccc] uppercase tracking-widest border-b border-[#333] pb-4 mb-4">Visual Summary</h3>
          <div className="flex flex-col gap-6">
            <CategoryDistributionChart data={data.categoryDistribution} />
            <AlignmentTrendChart data={data.dailyStats} />
          </div>
        </div>

      </div>
    </div>
  );
}
