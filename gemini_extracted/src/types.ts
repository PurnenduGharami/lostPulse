export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  targetLifespanYears: number;
}

export interface TimeBlock {
  id: string;
  title: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  category: string;
  categoryId?: string;
  description?: string;
  mood?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  lastUsedAt: number;
  isUncategorized?: boolean;
}

export interface DailyReflection {
  energy: number; // 1-5
  focus: number; // 1-5
  mood: string;
  note?: string;
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
  subtitle: string;
  description: string;
  purpose?: string;
  reward?: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export interface BlockActions {
  saveBlock: (dateStr: string, block: TimeBlock) => Promise<boolean>;
  updateBlock: (dateStr: string, block: TimeBlock) => Promise<boolean>;
  deleteBlock: (dateStr: string, blockId: string) => Promise<void>;
  batchUpdateBlocks?: (dateStr: string, blocks: TimeBlock[]) => Promise<void>;
  batchSaveBlocks?: (dateStr: string, blocks: TimeBlock[]) => Promise<void>;
}

export interface NoteActions {
  saveDailyNotes: (dateStr: string, notes: string[]) => Promise<void>;
  saveDailyReflection: (dateStr: string, reflection: DailyReflection) => Promise<void>;
}

export interface CategoryActions {
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (id: string, name: string, color: string) => Promise<void>;
  deleteCategory: (id: string, fallbackId: string) => Promise<void>;
  markCategoryUsed: (id: string) => Promise<void>;
}
