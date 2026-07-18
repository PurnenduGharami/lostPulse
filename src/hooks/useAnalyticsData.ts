import { useMemo } from 'react';
import type { TimeBlock, Category, DailyReflection } from '../types';
import { calculateEffectiveDurations } from '../utils';
import type { TimeRange } from '../components/AnalyticsContainer';

interface AnalyticsDataOptions {
  timeBlocks: Record<string, TimeBlock[]>;
  plannedBlocks: Record<string, TimeBlock[]>;
  categories: Category[];
  dailyReflections: Record<string, DailyReflection>;
  timeRange: TimeRange;
  anchorDateMs: number;
}

export function useAnalyticsData({
  timeBlocks,
  plannedBlocks,
  categories,
  dailyReflections,
  timeRange,
  anchorDateMs
}: AnalyticsDataOptions) {
  const rangeData = useMemo(() => {
    const anchor = new Date(anchorDateMs);
    let startDate = new Date(anchor);
    let endDate = new Date(anchor);

    // 1. Determine Date Range
    if (timeRange === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // start on Monday
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeRange === 'monthly') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (timeRange === '3-months') {
      const q = Math.floor(startDate.getMonth() / 3);
      startDate.setMonth(q * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0, 23, 59, 59, 999);
    } else if (timeRange === '6-months') {
      const half = startDate.getMonth() < 6 ? 0 : 6;
      startDate.setMonth(half, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6, 0, 23, 59, 59, 999);
    } else if (timeRange === 'yearly') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    // 2. Gather Blocks for Range
    const rangeTimeBlocks: TimeBlock[] = [];
    const rangePlannedBlocks: TimeBlock[] = [];
    const dateMap = new Map<string, { tracked: TimeBlock[], planned: TimeBlock[], reflection?: DailyReflection }>();

    // Optimized filtering: only check strings that might match if possible, but for range we can just check time.
    Object.keys(timeBlocks).forEach(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const ms = new Date(y, m - 1, d).getTime();
      if (ms >= startMs && ms <= endMs) {
        rangeTimeBlocks.push(...timeBlocks[dateStr]);
        if (!dateMap.has(dateStr)) dateMap.set(dateStr, { tracked: [], planned: [] });
        dateMap.get(dateStr)!.tracked = timeBlocks[dateStr];
      }
    });

    Object.keys(plannedBlocks).forEach(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const ms = new Date(y, m - 1, d).getTime();
      if (ms >= startMs && ms <= endMs) {
        rangePlannedBlocks.push(...plannedBlocks[dateStr]);
        if (!dateMap.has(dateStr)) dateMap.set(dateStr, { tracked: [], planned: [] });
        dateMap.get(dateStr)!.planned = plannedBlocks[dateStr];
      }
    });

    Object.keys(dailyReflections).forEach(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const ms = new Date(y, m - 1, d).getTime();
      if (ms >= startMs && ms <= endMs) {
        if (!dateMap.has(dateStr)) dateMap.set(dateStr, { tracked: [], planned: [] });
        dateMap.get(dateStr)!.reflection = dailyReflections[dateStr];
      }
    });

    // 3. Compute High-Level Stats
    let totalRecordedMs = 0;
    let totalPlannedMs = 0;
    let totalFocusSessions = 0;
    
    const rangeTEff = calculateEffectiveDurations(rangeTimeBlocks);
    rangeTimeBlocks.forEach(b => {
      totalRecordedMs += (rangeTEff[b.id] || 0);
      if (b.linkedPlannerTaskId || (b.title && b.title.includes('Focus'))) {
        totalFocusSessions++;
      }
    });

    const rangePEff = calculateEffectiveDurations(rangePlannedBlocks);
    rangePlannedBlocks.forEach(b => {
      totalPlannedMs += (rangePEff[b.id] || 0);
    });

    const calculateAlignment = (tracked: TimeBlock[], planned: TimeBlock[]) => {
      let score = 0;
      
      const pEff = calculateEffectiveDurations(planned);
      const pMs = planned.reduce((acc, b) => acc + (pEff[b.id] || 0), 0);
      const planRatio = Math.min(pMs / (14 * 3600000), 1);
      score += planRatio * 40;

      const tEff = calculateEffectiveDurations(tracked);
      const tMs = tracked.reduce((acc, b) => acc + (tEff[b.id] || 0), 0);
      const recordRatio = Math.min(tMs / (14 * 3600000), 1);
      score += recordRatio * 40;

      const plannedCategoryIds = new Set(planned.map(b => b.categoryId || b.category).filter(Boolean));
      let matchedMs = 0;
      tracked.forEach(b => {
        const catId = b.categoryId || b.category;
        if (catId && plannedCategoryIds.has(catId)) {
          matchedMs += (tEff[b.id] || 0);
        }
      });
      const matchRatio = tMs > 0 ? Math.min(matchedMs / tMs, 1) : 0;
      score += matchRatio * 20;

      return Math.round(score);
    };

    let alignmentSum = 0;
    let daysWithPlans = 0;
    const dailyStats: any[] = [];

    dateMap.forEach((data, dateStr) => {
      const aScore = calculateAlignment(data.tracked, data.planned);
      if (data.planned.length > 0) {
        alignmentSum += aScore;
        daysWithPlans++;
      }
      
      const tEff = calculateEffectiveDurations(data.tracked);
      const tMs = data.tracked.reduce((acc, b) => acc + (tEff[b.id] || 0), 0);
      const pEff = calculateEffectiveDurations(data.planned);
      const pMs = data.planned.reduce((acc, b) => acc + (pEff[b.id] || 0), 0);
      
      let fSessions = 0;
      data.tracked.forEach(b => {
        if (b.linkedPlannerTaskId || (b.title && b.title.includes('Focus'))) {
          fSessions++;
        }
      });
      
      dailyStats.push({
        date: dateStr,
        alignment: aScore,
        trackedMs: tMs,
        plannedMs: pMs,
        focusSessions: fSessions,
        hasReflection: !!(data.reflection && data.reflection.wasWorthIt !== null)
      });
    });

    dailyStats.sort((a, b) => a.date.localeCompare(b.date));

    const avgAlignment = daysWithPlans > 0 ? Math.round(alignmentSum / daysWithPlans) : 0;
    
    let bestDay = null;
    let worstDay = null;
    if (dailyStats.length > 0) {
      bestDay = dailyStats.reduce((prev, curr) => (curr.alignment > prev.alignment ? curr : prev));
      worstDay = dailyStats.reduce((prev, curr) => (curr.alignment < prev.alignment && curr.alignment > 0 ? curr : prev));
    }

    // Category Distribution
    const catMap = new Map<string, { ms: number, category: Category }>();
    rangeTimeBlocks.forEach(b => {
      const cid = b.categoryId || 'uncategorized';
      const cat = categories.find(c => c.id === cid) || categories.find(c => c.id === 'uncategorized')!;
      if (!catMap.has(cid)) catMap.set(cid, { ms: 0, category: cat });
      catMap.get(cid)!.ms += (b.endTime - b.startTime);
    });

    const categoryDistribution = Array.from(catMap.values())
      .sort((a, b) => b.ms - a.ms);

    return {
      periodStart: startDate,
      periodEnd: endDate,
      totalRecordedMs,
      totalPlannedMs,
      totalFocusSessions,
      avgAlignment,
      bestDay,
      worstDay,
      dailyStats,
      categoryDistribution,
      rangeTimeBlocks,
      rangePlannedBlocks
    };
  }, [timeBlocks, plannedBlocks, categories, dailyReflections, timeRange, anchorDateMs]);

  const heatmapData = useMemo(() => {
    const anchor = new Date(anchorDateMs);
    const targetYear = anchor.getFullYear().toString();
    const heatmap = new Map<string, number>();

    const calculateAlignment = (tracked: TimeBlock[], planned: TimeBlock[]) => {
      let score = 0;
      
      const pEff = calculateEffectiveDurations(planned);
      const pMs = planned.reduce((acc, b) => acc + (pEff[b.id] || 0), 0);
      const planRatio = Math.min(pMs / (14 * 3600000), 1);
      score += planRatio * 40;

      const tEff = calculateEffectiveDurations(tracked);
      const tMs = tracked.reduce((acc, b) => acc + (tEff[b.id] || 0), 0);
      const recordRatio = Math.min(tMs / (14 * 3600000), 1);
      score += recordRatio * 40;

      const plannedCategoryIds = new Set(planned.map(b => b.categoryId || b.category).filter(Boolean));
      let matchedMs = 0;
      tracked.forEach(b => {
        const catId = b.categoryId || b.category;
        if (catId && plannedCategoryIds.has(catId)) {
          matchedMs += (tEff[b.id] || 0);
        }
      });
      const matchRatio = tMs > 0 ? Math.min(matchedMs / tMs, 1) : 0;
      score += matchRatio * 20;

      return Math.round(score);
    };

    Object.keys(plannedBlocks).forEach(dateStr => {
      if (dateStr.startsWith(targetYear)) {
        const aScore = calculateAlignment(timeBlocks[dateStr] || [], plannedBlocks[dateStr]);
        heatmap.set(dateStr, aScore);
      }
    });

    Object.keys(timeBlocks).forEach(dateStr => {
      if (dateStr.startsWith(targetYear) && !heatmap.has(dateStr)) {
        if (timeBlocks[dateStr].length > 0) {
          heatmap.set(dateStr, 10);
        }
      }
    });

    return heatmap;
  }, [timeBlocks, plannedBlocks, anchorDateMs]);

  return {
    ...rangeData,
    heatmapData
  };
}
