import { useMemo } from 'react';
import TimeTrackerContainer from './TimeTrackerContainer';
import TimePlannerContainer from './TimePlannerContainer';
import DailyReportContainer from './DailyReportContainer';
import AnalyticsContainer from './AnalyticsContainer';
import LockedFeature from './LockedFeature';

import type { UserProfile, TimeBlock, BlockActions, Category, CategoryActions, NoteActions } from '../types';

interface FeatureProgressionProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  blockActions: BlockActions;
  categories: Category[];
  categoryActions: CategoryActions;
  dailyNotes: Record<string, string[]>;
  noteActions: NoteActions;
  plannedBlocks: Record<string, TimeBlock[]>;
  plannedBlockActions: BlockActions;
  plannedDailyNotes: Record<string, string[]>;
  plannedNoteActions: NoteActions;
  dailyReflections: Record<string, import('../types').DailyReflection>;
  goals: Record<string, string>;
  saveGoal: (key: string, value: string) => Promise<void>;
}

export default function FeatureProgression({ 
  userProfile, 
  timeBlocks, 
  blockActions, 
  categories, 
  categoryActions, 
  dailyNotes, 
  noteActions,
  plannedBlocks,
  plannedBlockActions,
  plannedDailyNotes,
  plannedNoteActions,
  dailyReflections,
  goals,
  saveGoal
}: FeatureProgressionProps) {
  // Calculate total tracked hours
  const totalHours = useMemo(() => {
    let totalMs = 0;
    Object.values(timeBlocks).forEach(blocks => {
      blocks.forEach(block => {
        totalMs += (block.endTime - block.startTime);
      });
    });
    return totalMs / 3600000;
  }, [timeBlocks]);

  return (
    <>
      {/* Tracker - Unlocked immediately */}
      <section className="snap-start w-full h-screen">
        <TimeTrackerContainer 
          userProfile={userProfile} 
          timeBlocks={timeBlocks} 
          blockActions={blockActions}
          categories={categories}
          categoryActions={categoryActions}
          dailyNotes={dailyNotes}
          noteActions={noteActions}
        />
      </section>

      {/* Planner - Locked until 12 hours tracked */}
      <section className="snap-start w-full h-screen">
        {totalHours >= 12 ? (
          <TimePlannerContainer
            userProfile={userProfile} 
            plannedBlocks={plannedBlocks} 
            plannedBlockActions={plannedBlockActions}
            categories={categories}
            categoryActions={categoryActions}
            plannedDailyNotes={plannedDailyNotes}
            plannedNoteActions={plannedNoteActions}
            trackerBlockActions={blockActions}
          />
        ) : (
          <LockedFeature 
            title="Time Planner"
            description="Track 12 hours of past activity to unlock the ability to plan your future time."
            progress={totalHours / 12}
            progressText={`${totalHours.toFixed(1)} / 12 HOURS`}
          />
        )}
      </section>

      {/* Daily Report - Locked until 24 hours tracked */}
      <section className="snap-start w-full h-screen">
        {totalHours >= 24 ? (
          <DailyReportContainer
            userProfile={userProfile}
            timeBlocks={timeBlocks}
            plannedBlocks={plannedBlocks}
            categories={categories}
            dailyReflections={dailyReflections}
            noteActions={noteActions}
          />
        ) : (
          <LockedFeature 
            title="Daily Report"
            description="Track 24 hours of total activity to unlock your daily reflection and analytics."
            progress={totalHours / 24}
            progressText={`${totalHours.toFixed(1)} / 24 HOURS`}
          />
        )}
      </section>

      {/* Analytics - Locked until 48 hours tracked */}
      <section className="snap-start w-full h-screen">
        {totalHours >= 48 ? (
          <AnalyticsContainer
            userProfile={userProfile}
            timeBlocks={timeBlocks}
            plannedBlocks={plannedBlocks}
            categories={categories}
            dailyReflections={dailyReflections}
            goals={goals}
            saveGoal={saveGoal}
          />
        ) : (
          <LockedFeature 
            title="Analytics"
            description="Track 48 hours of total activity to unlock long-term analytics and life trends."
            progress={totalHours / 48}
            progressText={`${totalHours.toFixed(1)} / 48 HOURS`}
          />
        )}
      </section>
    </>
  );
}
