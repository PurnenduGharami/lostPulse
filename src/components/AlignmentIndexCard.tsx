import type { TimeBlock } from '../types';

interface AlignmentIndexCardProps {
  plannedBlocks: TimeBlock[];
  trackedBlocks: TimeBlock[];
  reflection?: any;
}

export default function AlignmentIndexCard({ plannedBlocks, trackedBlocks, reflection }: AlignmentIndexCardProps) {
  // A simple heuristic for Alignment Score:
  // 1. Completion Ratio (Completed Planned tasks / Total Planned tasks) - 40% weight
  // 2. Volume Ratio (Tracked Time / Planned Time) - 40% weight
  // 3. Exact Matching (Tracked Blocks linked to Planner Tasks) - 20% weight

  let score = 0;
  let completionRatio = 0;
  let volumeRatio = 0;
  let trackingRatio = 0;

  // New metrics
  let unplannedTimeMs = 0;
  let missedTasksCount = 0;
  let planDeviationMs = 0;
  let avgStartDelayMs = 0;

  if (plannedBlocks.length > 0) {
    // 1. Completion Ratio (0-40)
    const completedTasksCount = plannedBlocks.filter(b => b.status === 'Completed').length;
    completionRatio = completedTasksCount / plannedBlocks.length;
    score += completionRatio * 40;

    // 2. Volume Ratio (0-40)
    const plannedTimeMs = plannedBlocks.reduce((acc, b) => acc + (b.endTime - b.startTime), 0);
    const recordedTimeMs = trackedBlocks.reduce((acc, b) => acc + (b.endTime - b.startTime), 0);
    
    if (plannedTimeMs > 0) {
      volumeRatio = Math.min(recordedTimeMs / plannedTimeMs, 1);
      score += volumeRatio * 40;
    }

    // 3. Exact Matching (0-20)
    const linkedTrackedBlocks = trackedBlocks.filter(b => b.linkedPlannerTaskId).length;
    trackingRatio = Math.min(linkedTrackedBlocks / plannedBlocks.length, 1);
    score += trackingRatio * 20;

    // Calculate new metrics
    unplannedTimeMs = trackedBlocks.filter(b => !b.linkedPlannerTaskId).reduce((acc, b) => acc + (b.endTime - b.startTime), 0);
    missedTasksCount = plannedBlocks.filter(b => b.status !== 'Completed').length;
    planDeviationMs = Math.abs(plannedTimeMs - recordedTimeMs);

    let totalDelayMs = 0;
    let delayedTasksCount = 0;
    trackedBlocks.forEach(tb => {
      if (tb.linkedPlannerTaskId) {
        const pb = plannedBlocks.find(p => p.id === tb.linkedPlannerTaskId);
        if (pb) {
          const delay = tb.startTime - pb.startTime;
          if (delay > 0) {
            totalDelayMs += delay;
            delayedTasksCount++;
          }
        }
      }
    });
    avgStartDelayMs = delayedTasksCount > 0 ? totalDelayMs / delayedTasksCount : 0;
  }

  const formatDuration = (ms: number) => {
    if (ms === 0) return '0m';
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const finalScore = Math.round(score);

  let explanation = "No plans made today.";
  if (plannedBlocks.length > 0) {
    if (finalScore >= 90) explanation = "A masterclass in execution. You did exactly what you set out to do.";
    else if (finalScore >= 70) explanation = "A solid day of aligned focus.";
    else if (finalScore >= 50) explanation = "Half the battle. Some deviations, but you kept moving.";
    else if (finalScore > 0) explanation = "Plans derailed. Use tomorrow to course-correct.";
    else explanation = "Entirely off course.";
  }

  const reflectionStatus = reflection && reflection.wasWorthIt !== null ? "Completed" : "Pending";

  return (
    <div className="w-full h-full liquid-panel p-8 rounded-md border border-[#333] mb-6 flex flex-col relative overflow-hidden">

      
      <div className="flex flex-col items-center justify-center text-center z-10 mb-6">
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#aaaaaa] mb-4">Alignment Index</h3>
        
        <div className="flex items-end justify-center gap-2 mb-2">
          <span className={`text-6xl font-cinzel font-bold drop-shadow-lg ${finalScore >= 80 ? 'text-emerald-400' : finalScore >= 50 ? 'text-yellow-400' : 'text-red-500'}`}>
            {finalScore}
          </span>
          <span className="text-xl font-mono text-[#555] mb-2">/ 100</span>
        </div>

        <span className={`text-sm font-mono uppercase tracking-widest font-bold ${finalScore >= 80 ? 'text-emerald-400' : finalScore >= 50 ? 'text-yellow-400' : 'text-red-500'}`}>
          {finalScore >= 90 ? 'Excellent' : finalScore >= 70 ? 'Good' : finalScore >= 50 ? 'Fair' : 'Poor'}
        </span>
      </div>

      <div className="w-full border-t border-[#333] my-4 z-10"></div>

      <div className="w-full space-y-3 z-10 flex-1 flex flex-col justify-center px-4">
        <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest">
          <span className="text-[#888]">Planning Accuracy</span>
          <span className="text-white">{Math.round(completionRatio * 100)}%</span>
        </div>
        
        <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest">
          <span className="text-[#888]">Task Completion</span>
          <span className="text-white">{Math.round(completionRatio * 100)}%</span>
        </div>
        
        <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest">
          <span className="text-[#888]">Recorded Time</span>
          <span className="text-white">{Math.round(volumeRatio * 100)}%</span>
        </div>
        
        <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest">
          <span className="text-[#888]">Focus Sessions</span>
          <span className="text-white">{trackedBlocks.filter(b => b.linkedPlannerTaskId || (b.title && b.title.includes('Focus'))).length}</span>
        </div>

        <div className="flex justify-between items-center text-xs font-mono uppercase tracking-widest">
          <span className="text-[#888]">Daily Reflection</span>
          <span className={reflectionStatus === "Completed" ? "text-emerald-400" : "text-yellow-500"}>
            {reflectionStatus}
          </span>
        </div>

        <div className="h-2"></div>

        <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
          <span className="text-[#666]">Unplanned Time</span>
          <span className="text-[#aaa]">{formatDuration(unplannedTimeMs)}</span>
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
          <span className="text-[#666]">Missed Tasks</span>
          <span className="text-[#aaa]">{missedTasksCount}</span>
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
          <span className="text-[#666]">Plan Deviation</span>
          <span className="text-[#aaa]">{formatDuration(planDeviationMs)}</span>
        </div>
        
        <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
          <span className="text-[#666]">Average Start Delay</span>
          <span className="text-[#aaa]">{formatDuration(avgStartDelayMs)}</span>
        </div>
      </div>

      <div className="w-full border-t border-[#333] my-4 z-10"></div>

      <div className="w-full text-center z-10 pt-2">
        <p className="text-xs font-sans text-[#aaaaaa] italic">
          "{explanation}"
        </p>
      </div>
    </div>
  );
}
