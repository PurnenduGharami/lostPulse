import type { TimeBlock, Category } from '../types';
import { formatTimeString } from '../utils';

interface ActivityTimelineStoryProps {
  plannedBlocks: TimeBlock[];
  trackedBlocks: TimeBlock[];
  categories: Category[];
}

export default function ActivityTimelineStory({ plannedBlocks, trackedBlocks, categories }: ActivityTimelineStoryProps) {
  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '#555555';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.color : '#555555';
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  interface TimelineEvent {
    id: string;
    timeMs: number;
    title: string;
    type: 'merged' | 'unplanned' | 'completed_no_time' | 'missed';
    categoryId?: string;
    plannedBlock?: TimeBlock;
    trackedBlock?: TimeBlock;
  }

  const events: TimelineEvent[] = [];
  const processedPlannedIds = new Set<string>();

  const formatDuration = (ms: number) => {
    if (ms === 0) return '0h';
    const hours = Math.floor(Math.abs(ms) / 3600000);
    const mins = Math.floor((Math.abs(ms) % 3600000) / 60000);
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };



  // 1. Recorded Sessions
  trackedBlocks.forEach(tb => {
    if (tb.linkedPlannerTaskId) {
      const pb = plannedBlocks.find(p => p.id === tb.linkedPlannerTaskId);
      if (pb) {
        processedPlannedIds.add(pb.id);
        events.push({
          id: tb.id,
          timeMs: tb.startTime, // Anchor to actual start time
          title: tb.title || 'Recorded Session',
          type: 'merged',
          categoryId: tb.categoryId,
          plannedBlock: pb,
          trackedBlock: tb
        });
      } else {
        events.push({
          id: tb.id,
          timeMs: tb.startTime,
          title: tb.title || 'Recorded Session',
          type: 'unplanned',
          categoryId: tb.categoryId,
          trackedBlock: tb
        });
      }
    } else {
      events.push({
        id: tb.id,
        timeMs: tb.startTime,
        title: tb.title || 'Recorded Session',
        type: 'unplanned',
        categoryId: tb.categoryId,
        trackedBlock: tb
      });
    }
  });

  // 2 & 3. Completed Planned Tasks (Without Tracked Time) & Missed Planned Tasks
  plannedBlocks.forEach(pb => {
    if (!processedPlannedIds.has(pb.id)) {
      if (pb.status === 'Completed') {
        events.push({
          id: pb.id,
          timeMs: pb.startTime,
          title: pb.title || 'Planned Task',
          type: 'completed_no_time',
          categoryId: pb.categoryId,
          plannedBlock: pb
        });
      } else {
        events.push({
          id: pb.id,
          timeMs: pb.startTime,
          title: pb.title || 'Planned Task',
          type: 'missed',
          categoryId: pb.categoryId,
          plannedBlock: pb
        });
      }
    }
  });

  // Sort chronologically
  events.sort((a, b) => a.timeMs - b.timeMs);

  const getDifferenceText = (actual: number, planned: number, isStart: boolean) => {
    const diff = actual - planned;
    const absDiffMins = Math.floor(Math.abs(diff) / 60000);
    if (absDiffMins <= 5) return 'Matched Plan';
    
    if (isStart) {
      return diff > 0 ? `Started ${absDiffMins}m late` : `Started ${absDiffMins}m early`;
    } else {
      return diff > 0 ? `Finished ${absDiffMins}m late` : `Finished ${absDiffMins}m early`;
    }
  };

  return (
    <div className="w-full liquid-panel p-6 rounded-md border border-[#333] mb-6">
      <h3 className="font-serif text-white text-lg mb-6">Activity Timeline</h3>

      <div className="relative border-l border-[#333] ml-4 pl-6 space-y-8">
        {events.map((evt, idx) => {
          const color = getCategoryColor(evt.categoryId);
          
          let icon = '';
          let primaryDesc = '';
          let statusText = '';
          let opacityClass = 'opacity-100';

          if (evt.type === 'merged' && evt.trackedBlock && evt.plannedBlock) {
            icon = '●';
            primaryDesc = 'Recorded Session';
            const startStatus = getDifferenceText(evt.trackedBlock.startTime, evt.plannedBlock.startTime, true);
            const endStatus = getDifferenceText(evt.trackedBlock.endTime, evt.plannedBlock.endTime, false);
            
            if (startStatus === 'Matched Plan' && endStatus === 'Matched Plan') {
              statusText = 'Status:\nMatched Plan';
            } else {
              statusText = `Status:\n${startStatus}\n${endStatus}`;
            }
          } else if (evt.type === 'unplanned' && evt.trackedBlock) {
            icon = '●';
            primaryDesc = 'Unplanned Activity';
          } else if (evt.type === 'completed_no_time') {
            icon = '○';
            primaryDesc = 'Completed (No Time Recorded)';
          } else if (evt.type === 'missed') {
            icon = '○';
            primaryDesc = 'Missed';
            opacityClass = 'opacity-40';
          }

          return (
            <div key={`${evt.id}-${idx}`} className={`relative group ${opacityClass}`}>
              <div 
                className="absolute -left-[31px] top-1 w-3 h-3 rounded-full flex items-center justify-center text-[10px]"
                style={{ color: color, backgroundColor: '#0a0a0c', border: `1px solid ${color}` }}
              >
                {icon}
              </div>
              
              <div className="flex flex-col">
                <span className="font-mono text-xs text-[#aaaaaa] mb-1">{formatTimeString(evt.timeMs)}</span>
                <span className="font-serif text-white text-lg mb-1">{evt.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color }}>{primaryDesc}</span>
                
                {statusText && (
                  <span className="font-mono text-[10px] text-[#aaaaaa] mt-2 whitespace-pre-line leading-relaxed">
                    {statusText}
                  </span>
                )}
              </div>

              {/* Hover Details Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-64 bg-[#1a1a1c] border border-[#444] rounded-md p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-[#333] pb-2 mb-1">
                    <span className="font-serif text-white">{evt.title}</span>
                    <span className="font-mono text-[10px] uppercase" style={{ color }}>{getCategoryName(evt.categoryId)}</span>
                  </div>
                  
                  {evt.type === 'merged' && evt.plannedBlock && evt.trackedBlock && (
                    <>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#888]">Planned</span>
                        <span className="text-[#ccc]">{formatTimeString(evt.plannedBlock.startTime)} - {formatTimeString(evt.plannedBlock.endTime)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#888]">Actual</span>
                        <span className="text-white">{formatTimeString(evt.trackedBlock.startTime)} - {formatTimeString(evt.trackedBlock.endTime)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono pt-1">
                        <span className="text-[#888]">Diff</span>
                        <span className={evt.trackedBlock.endTime - evt.trackedBlock.startTime - (evt.plannedBlock.endTime - evt.plannedBlock.startTime) > 0 ? 'text-yellow-500' : 'text-emerald-500'}>
                          {(() => {
                            const diff = evt.trackedBlock.endTime - evt.trackedBlock.startTime - (evt.plannedBlock.endTime - evt.plannedBlock.startTime);
                            if (Math.abs(diff) < 60000) return 'Matched';
                            const sign = diff > 0 ? '+' : '-';
                            return `${sign}${formatDuration(Math.abs(diff))}`;
                          })()}
                        </span>
                      </div>
                    </>
                  )}

                  {evt.type === 'unplanned' && evt.trackedBlock && (
                    <>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#888]">Recorded</span>
                          <span className="text-white">{formatTimeString(evt.trackedBlock.startTime)} - {formatTimeString(evt.trackedBlock.endTime)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono pt-1">
                        <span className="text-[#888]">Duration</span>
                        <span className="text-white">{formatDuration(evt.trackedBlock.endTime - evt.trackedBlock.startTime)}</span>
                      </div>
                    </>
                  )}

                  {(evt.type === 'missed' || evt.type === 'completed_no_time') && evt.plannedBlock && (
                    <>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#888]">Planned</span>
                          <span className="text-[#ccc]">{formatTimeString(evt.plannedBlock.startTime)} - {formatTimeString(evt.plannedBlock.endTime)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono pt-1">
                        <span className="text-[#888]">Status</span>
                        <span className={evt.type === 'missed' ? 'text-red-500' : 'text-emerald-500'}>
                          {evt.type === 'missed' ? 'Missed' : 'Completed'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="text-[#555] font-mono text-xs uppercase tracking-widest">
            No activities recorded today.
          </div>
        )}
      </div>
    </div>
  );
}
