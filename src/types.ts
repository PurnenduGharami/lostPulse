export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  targetLifespan: number; // in years
  createdAt: number; // exact time of registration (epoch ms)
  gender?: string;
  country?: string;
  timezone?: string;
  sleepTarget?: number; // hours
  preferredStartOfDay?: string; // HH:mm
  preferredEndOfDay?: string; // HH:mm
  use24HourFormat?: boolean;
  
  // Life Goals Settings
  missionStatement?: string;
  philosophy?: string;
  values?: string[];
  lifeGoals?: LifeGoal[];
}

export interface LifeGoal {
  id: string;
  type: 'long_term' | 'priority' | 'dream_project' | 'bucket_list';
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  targetDate?: string;
  color?: string;
  notes?: string;
}

// We can define others here as well for future use, but for our single feature this is what's required.
export interface Activity {
  id: string;
  category: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: number; // epoch ms to strictly calculate 12-hour requirement
  endTime: number; // epoch ms to strictly calculate 12-hour requirement
  estimatedDurationMs?: number; // optionally used for unscheduled tasks
  accumulatedTimeMs?: number;
  status: 'Completed' | 'Partial' | 'Missed' | 'Pending' | 'In Progress' | 'Paused';
  categoryId?: string;
  category?: string; // Legacy, kept for backwards compatibility during migration
  isFavorite?: boolean;
  createdAt: number;
  updatedAt?: number;
  linkedTrackerEntryId?: string;
  linkedPlannerTaskId?: string;
}

export interface BlockActions {
  saveBlock: (dateStr: string, block: TimeBlock) => void;
  updateBlock: (dateStr: string, updatedBlock: TimeBlock) => void;
  deleteBlock: (dateStr: string, blockId: string) => void;
  batchUpdateBlocks?: (dateStr: string, blocks: TimeBlock[]) => void;
  batchSaveBlocks?: (dateStr: string, blocks: TimeBlock[]) => void;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  lastUsedAt: number;
  isUncategorized?: boolean;
  icon?: string;
  disabled?: boolean;
  isDefault?: boolean;
}

export interface CategoryActions {
  addCategory: (name: string, color: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (id: string, fallbackId: string) => void;
  markCategoryUsed: (id: string) => void;
}

export interface NoteActions {
  saveDailyNotes: (dateStr: string, notes: string[]) => void;
  saveDailyReflection: (dateStr: string, reflection: DailyReflection) => void;
}

export interface DailyReflection {
  date: string;
  wasWorthIt: boolean | null;
  reason: string;
}

export interface TimeJournalFilters {
  dateMode: 'daily' | 'weekly' | 'monthly' | 'all-time';
  category: string;
  minDurationMs: number | null;
  maxDurationMs: number | null;
  hasNotes: boolean;
  isFavorite: boolean;
}

export interface JournalEntry {
  date: string;
  mood: string;
  mattered: string;
  wasted: string;
  improve: string;
}

export interface ProgressionState {
  hasSeenWelcome: boolean;
  blueprintUnlocked: boolean;
  blueprintSeen: boolean;
  epilogueUnlocked: boolean;
  epilogueSeen: boolean;
  chronicleUnlocked: boolean;
  chronicleSeen: boolean;
  lastCompletedDayChecked?: string;
}

export interface CinematicNotification {
  id: string;
  type: 'welcome' | 'unlock' | 'day_complete';
  title: string;
  subtitle?: string;
  description: string;
  purpose?: string;
  reward?: string;
  actionText?: string;
  onDismiss?: () => void;
  onAction?: () => void;
}
