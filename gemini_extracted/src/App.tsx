import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserProfile, TimeBlock, BlockActions, Category, CategoryActions, NoteActions, DailyReflection, ProgressionState, CinematicNotification } from './types';
import {
  loadData,
  saveData,
  splitBlockAcrossMidnight,
  calculateLifeRemaining,
  getMaxHoursInSingleDay,
  getCompletedDaysCount,
  hasOverlap,
  checkLiveSessionCollision,
  formatDateKey
} from './utils';
import Onboarding from './components/Onboarding';
import HeroSection from './components/HeroSection';
import TimeTrackerContainer from './components/TimeTrackerContainer';
import TimePlannerContainer from './components/TimePlannerContainer';
import DailyReportContainer from './components/DailyReportContainer';
import AnalyticsContainer from './components/AnalyticsContainer';
import LockedFeature from './components/LockedFeature';
import FloatingNav, { type WorkspaceType } from './components/FloatingNav';
import ProgressionOverlay from './components/ProgressionOverlay';
import FirstTimeGuidance from './components/FirstTimeGuidance';
import SettingsContainer from './components/SettingsContainer';
import CommandPalette from './components/CommandPalette';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from './contexts/NotificationContext';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', color: '#555555', lastUsedAt: 0, isUncategorized: true },
  { id: 'STUDY', name: 'Study', color: '#3b82f6', lastUsedAt: 0 },
  { id: 'WORK', name: 'Work', color: '#10b981', lastUsedAt: 0 },
  { id: 'SLEEP', name: 'Sleep', color: '#8b5cf6', lastUsedAt: 0 },
  { id: 'GAMING', name: 'Gaming', color: '#f43f5e', lastUsedAt: 0 },
  { id: 'SOCIAL', name: 'Social', color: '#f59e0b', lastUsedAt: 0 },
  { id: 'OTHER', name: 'Other', color: '#06b6d4', lastUsedAt: 0 },
];

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<Record<string, TimeBlock[]>>({});
  const [dailyNotes, setDailyNotes] = useState<Record<string, string[]>>({});
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [dailyReflections, setDailyReflections] = useState<Record<string, DailyReflection>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useNotification();

  // Undo/Redo History Stacks
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [plannedBlocks, setPlannedBlocks] = useState<Record<string, TimeBlock[]>>({});
  const [plannedDailyNotes, setPlannedDailyNotes] = useState<Record<string, string[]>>({});
  const [plannedHistory, setPlannedHistory] = useState<string[]>([]);
  const [plannedHistoryIndex, setPlannedHistoryIndex] = useState(-1);

  const [goals, setGoals] = useState<Record<string, string>>({});
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [mainScrollTop, setMainScrollTop] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  // Global Active Session Indicator (persists across workspace switches)
  const [activeTimerLabel, setActiveTimerLabel] = useState<string | null>(null);

  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>(
    () => (localStorage.getItem('lastWorkspace') as WorkspaceType) || 'tracker'
  );
  const [isNavVisible, setIsNavVisible] = useState(false);

  const [progression, setProgression] = useState<ProgressionState>({
    hasSeenWelcome: false,
    blueprintUnlocked: false,
    blueprintSeen: false,
    epilogueUnlocked: false,
    epilogueSeen: false,
    chronicleUnlocked: false,
    chronicleSeen: false,
    lastCompletedDayChecked: undefined
  });
  const [notifications, setNotifications] = useState<CinematicNotification[]>([]);

  const handleSelectWorkspace = useCallback((workspace: WorkspaceType) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('lastWorkspace', workspace);
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  }, []);

  // Poll active live/focus session for global top-right status pill
  useEffect(() => {
    const timer = setInterval(() => {
      const liveStart = localStorage.getItem('activeSessionStartTime');
      const livePause = localStorage.getItem('activeSessionPauseTime');
      const focusStart = localStorage.getItem('focusSessionStartTime');
      const focusPause = localStorage.getItem('focusSessionPauseTime');

      if (liveStart) {
        const title = localStorage.getItem('activeSessionTitle') || 'Live Session';
        const elapsed = (livePause ? parseInt(livePause, 10) : Date.now()) - parseInt(liveStart, 10);
        const mins = Math.floor(Math.max(0, elapsed) / 60000);
        const secs = Math.floor((Math.max(0, elapsed) % 60000) / 1000);
        setActiveTimerLabel(`LIVE: ${title} (${mins}:${secs.toString().padStart(2, '0')})${livePause ? ' [PAUSED]' : ''}`);
      } else if (focusStart) {
        const title = localStorage.getItem('focusSessionTitle') || 'Focus Session';
        const elapsed = (focusPause ? parseInt(focusPause, 10) : Date.now()) - parseInt(focusStart, 10);
        const mins = Math.floor(Math.max(0, elapsed) / 60000);
        const secs = Math.floor((Math.max(0, elapsed) % 60000) / 1000);
        setActiveTimerLabel(`FOCUS: ${title} (${mins}:${secs.toString().padStart(2, '0')})${focusPause ? ' [PAUSED]' : ''}`);
      } else {
        setActiveTimerLabel(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const [profile, blocks, notes, loadedCategories, pBlocks, pNotes, reflections, loadedGoals, loadedProgression] = await Promise.all([
        loadData<UserProfile>('userProfile'),
        loadData<Record<string, TimeBlock[]>>('timeBlocks'),
        loadData<Record<string, string[]>>('dailyNotes'),
        loadData<Category[]>('categories'),
        loadData<Record<string, TimeBlock[]>>('plannedBlocks'),
        loadData<Record<string, string[]>>('plannedDailyNotes'),
        loadData<Record<string, DailyReflection>>('dailyReflections'),
        loadData<Record<string, string>>('goals'),
        loadData<ProgressionState>('progression')
      ]);

      if (profile) setUserProfile(profile);
      const initialBlocks = blocks || {};
      setTimeBlocks(initialBlocks);
      setHistory([JSON.stringify(initialBlocks)]);
      setHistoryIndex(0);

      if (notes) setDailyNotes(notes);

      const initialPlanned = pBlocks || {};
      setPlannedBlocks(initialPlanned);
      setPlannedHistory([JSON.stringify(initialPlanned)]);
      setPlannedHistoryIndex(0);

      if (pNotes) setPlannedDailyNotes(pNotes);
      if (loadedCategories && loadedCategories.length > 0) setCategories(loadedCategories);
      if (reflections) setDailyReflections(reflections);
      if (loadedGoals) setGoals(loadedGoals);
      if (loadedProgression) setProgression(loadedProgression);

      setIsLoaded(true);
    };
    initialize();
  }, []);

  // Progressive Unlocking Engine
  useEffect(() => {
    if (!isLoaded) return;
    const newProg = { ...progression };
    let changed = false;
    const newNotifications: CinematicNotification[] = [];

    if (!newProg.hasSeenWelcome) {
      newNotifications.push({
        id: 'welcome',
        type: 'welcome',
        title: 'KRONOS RECORD',
        subtitle: 'CONGRATULATIONS',
        description: 'Record reality.\n\nObserve before you optimize.',
        purpose: 'Record where your time actually goes.',
        reward: 'Time Tracker unlocked.',
        actionText: 'ENTER KRONOS RECORD',
        onAction: () => handleSelectWorkspace('tracker'),
        onDismiss: () => {
          setProgression(prev => {
            const p = { ...prev, hasSeenWelcome: true };
            saveData('progression', p);
            return p;
          });
        }
      });
      newProg.hasSeenWelcome = true;
      changed = true;
    }

    if (!newProg.blueprintUnlocked && getMaxHoursInSingleDay(timeBlocks) >= 14) {
      newProg.blueprintUnlocked = true;
      changed = true;
      newNotifications.push({
        id: 'blueprint_unlock',
        type: 'unlock',
        title: 'KRONOS BLUEPRINT',
        subtitle: 'SYSTEM UNLOCKED',
        description: 'Design tomorrow.\n\nShape your future instead of recording your past.',
        purpose: 'Schedule your intentions before they happen.',
        reward: 'Time Planner unlocked.',
        actionText: 'ENTER KRONOS BLUEPRINT',
        onAction: () => handleSelectWorkspace('planner'),
        onDismiss: () => {}
      });
    }

    const todayStr = formatDateKey();

    if (!newProg.epilogueUnlocked && getCompletedDaysCount(timeBlocks, todayStr) >= 1) {
      newProg.epilogueUnlocked = true;
      changed = true;
      newNotifications.push({
        id: 'epilogue_unlock',
        type: 'unlock',
        title: 'EPILOGUE',
        subtitle: 'SYSTEM UNLOCKED',
        description: 'The day has ended.\n\nUnderstand how it was truly lived.',
        purpose: 'Close each day consciously with a debrief.',
        reward: 'Daily Report unlocked.',
        actionText: 'ENTER EPILOGUE',
        onAction: () => handleSelectWorkspace('report'),
        onDismiss: () => {}
      });
    }

    if (!newProg.chronicleUnlocked && getCompletedDaysCount(timeBlocks, todayStr) >= 7) {
      newProg.chronicleUnlocked = true;
      changed = true;
      newNotifications.push({
        id: 'chronicle_unlock',
        type: 'unlock',
        title: 'CHRONICLE',
        subtitle: 'SYSTEM UNLOCKED',
        description: 'Patterns reveal themselves.\n\nYour first week has become history.',
        purpose: 'Analyze macro-level time investments over time.',
        reward: 'Analytics unlocked.',
        actionText: 'ENTER CHRONICLE',
        onAction: () => handleSelectWorkspace('analytics'),
        onDismiss: () => {}
      });
    }

    if (newProg.lastCompletedDayChecked !== todayStr) {
      const today = new Date();
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      const yesterdayStr = formatDateKey(yesterday);

      if (timeBlocks[yesterdayStr] && timeBlocks[yesterdayStr].length > 0) {
        const life = calculateLifeRemaining(userProfile);
        newNotifications.push({
          id: `day_complete_${yesterdayStr}`,
          type: 'day_complete',
          title: 'Day Complete',
          subtitle: `${yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} has become history.`,
          description: `Life Remaining\n\n${life.years} Years\n${life.days} Days\n${life.hours} Hours`,
          actionText: newProg.epilogueUnlocked ? 'Open Epilogue' : 'Continue',
          onAction: newProg.epilogueUnlocked ? () => handleSelectWorkspace('report') : undefined,
          onDismiss: () => {
            setProgression(prev => {
              const p = { ...prev, lastCompletedDayChecked: todayStr };
              saveData('progression', p);
              return p;
            });
          }
        });
      }
      newProg.lastCompletedDayChecked = todayStr;
      changed = true;
    }

    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
    }
    if (changed) {
      setProgression(newProg);
      saveData('progression', newProg);
    }
  }, [timeBlocks, isLoaded, userProfile, progression, handleSelectWorkspace]);

  const markGuidanceSeen = (key: keyof ProgressionState) => {
    setProgression(prev => {
      const p = { ...prev, [key]: true };
      saveData('progression', p);
      return p;
    });
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    await saveData('userProfile', profile);
    setUserProfile(profile);
  };

  const commitTrackerState = useCallback(async (newBlocks: Record<string, TimeBlock[]>) => {
    const serialized = JSON.stringify(newBlocks);
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      const next = [...sliced, serialized].slice(-50);
      setHistoryIndex(next.length - 1);
      return next;
    });
    setTimeBlocks(newBlocks);
    await saveData('timeBlocks', newBlocks);
  }, [historyIndex]);

  const commitPlannerState = useCallback(async (newBlocks: Record<string, TimeBlock[]>) => {
    const serialized = JSON.stringify(newBlocks);
    setPlannedHistory(prev => {
      const sliced = prev.slice(0, plannedHistoryIndex + 1);
      const next = [...sliced, serialized].slice(-50);
      setPlannedHistoryIndex(next.length - 1);
      return next;
    });
    setPlannedBlocks(newBlocks);
    await saveData('plannedBlocks', newBlocks);
  }, [plannedHistoryIndex]);

  const performUndo = useCallback(async () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = JSON.parse(history[prevIndex]);
      setTimeBlocks(state);
      setHistoryIndex(prevIndex);
      await saveData('timeBlocks', state);
    }
  }, [history, historyIndex]);

  const performRedo = useCallback(async () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = JSON.parse(history[nextIndex]);
      setTimeBlocks(state);
      setHistoryIndex(nextIndex);
      await saveData('timeBlocks', state);
    }
  }, [history, historyIndex]);

  const performPlannedUndo = useCallback(async () => {
    if (plannedHistoryIndex > 0) {
      const prevIndex = plannedHistoryIndex - 1;
      const state = JSON.parse(plannedHistory[prevIndex]);
      setPlannedBlocks(state);
      setPlannedHistoryIndex(prevIndex);
      await saveData('plannedBlocks', state);
    }
  }, [plannedHistory, plannedHistoryIndex]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
        return;
      }

      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        setIsCmdOpen(false);
        window.dispatchEvent(new CustomEvent('close-modals'));
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('global-shortcut-n'));
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('global-shortcut-space'));
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        window.dispatchEvent(new CustomEvent('global-shortcut-delete'));
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) await performRedo();
          else await performUndo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          await performRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);

  // --- TRACKER BLOCK ACTIONS (WITH STRICT COLLISION CHECK) ---
  const handleSaveBlock = async (_dateStr: string, block: TimeBlock): Promise<boolean> => {
    if (block.endTime <= block.startTime) return false;

    if (checkLiveSessionCollision(block.startTime, block.endTime)) {
      toast('Collision detected with active session.');
      return false;
    }

    const newBlocks = { ...timeBlocks };
    const splitBlocks = splitBlockAcrossMidnight(block);

    for (const [dStr, blocksArr] of Object.entries(splitBlocks)) {
      const existing = newBlocks[dStr] || [];
      for (const seg of blocksArr) {
        if (hasOverlap(existing, seg.startTime, seg.endTime, seg.id)) {
          toast('Time block overlaps with an existing entry.');
          return false;
        }
      }
    }

    for (const [dStr, blocksArr] of Object.entries(splitBlocks)) {
      newBlocks[dStr] = [...(newBlocks[dStr] || []), ...blocksArr].sort((a, b) => a.startTime - b.startTime);
    }

    await commitTrackerState(newBlocks);
    return true;
  };

  const handleUpdateBlock = async (dateStr: string, updatedBlock: TimeBlock): Promise<boolean> => {
    if (updatedBlock.endTime <= updatedBlock.startTime) return false;

    const newBlocks = { ...timeBlocks };
    if (!newBlocks[dateStr]) return false;

    const filteredDay = newBlocks[dateStr].filter(b => b.id !== updatedBlock.id);
    const splitBlocks = splitBlockAcrossMidnight(updatedBlock);

    for (const [dStr, blocksArr] of Object.entries(splitBlocks)) {
      const existing = dStr === dateStr ? filteredDay : (newBlocks[dStr] || []);
      for (const seg of blocksArr) {
        if (hasOverlap(existing, seg.startTime, seg.endTime, updatedBlock.id)) {
          toast('Updated time overlaps with an existing entry.');
          return false;
        }
      }
    }

    newBlocks[dateStr] = filteredDay;
    for (const [dStr, blocksArr] of Object.entries(splitBlocks)) {
      newBlocks[dStr] = [...(newBlocks[dStr] || []), ...blocksArr].sort((a, b) => a.startTime - b.startTime);
    }

    await commitTrackerState(newBlocks);
    return true;
  };

  const handleDeleteBlock = async (dateStr: string, blockId: string) => {
    const newBlocks = { ...timeBlocks };
    if (!newBlocks[dateStr]) return;
    newBlocks[dateStr] = newBlocks[dateStr].filter(b => b.id !== blockId);
    await commitTrackerState(newBlocks);
    toast('Time block deleted.', () => {
      performUndo();
    });
  };

  const handleBatchUpdateBlocks = async (dateStr: string, updatedBlocks: TimeBlock[]) => {
    const newBlocks = { ...timeBlocks };
    if (!newBlocks[dateStr]) return;
    let modified = false;

    updatedBlocks.forEach(updatedBlock => {
      if (updatedBlock.endTime <= updatedBlock.startTime) return;
      const exists = newBlocks[dateStr].some(b => b.id === updatedBlock.id);
      if (exists) {
        newBlocks[dateStr] = newBlocks[dateStr].filter(b => b.id !== updatedBlock.id);
        const splitBlocks = splitBlockAcrossMidnight(updatedBlock);
        for (const [dStr, blocksArr] of Object.entries(splitBlocks)) {
          newBlocks[dStr] = [...(newBlocks[dStr] || []), ...blocksArr].sort((a, b) => a.startTime - b.startTime);
        }
        modified = true;
      }
    });

    if (modified) await commitTrackerState(newBlocks);
  };

  const blockActions: BlockActions = {
    saveBlock: handleSaveBlock,
    updateBlock: handleUpdateBlock,
    deleteBlock: handleDeleteBlock,
    batchUpdateBlocks: handleBatchUpdateBlocks
  };

  // --- PLANNER BLOCK ACTIONS ---
  const handleSavePlannedBlock = async (dateStr: string, block: TimeBlock): Promise<boolean> => {
    const existing = plannedBlocks[dateStr] || [];
    if (block.startTime !== block.endTime && hasOverlap(existing, block.startTime, block.endTime, block.id)) {
      toast('Planned block overlaps with another scheduled task.');
      return false;
    }
    const newBlocks = { ...plannedBlocks, [dateStr]: [...existing, block].sort((a, b) => a.startTime - b.startTime) };
    await commitPlannerState(newBlocks);
    return true;
  };

  const handleUpdatePlannedBlock = async (dateStr: string, updatedBlock: TimeBlock): Promise<boolean> => {
    const existing = plannedBlocks[dateStr] || [];
    if (updatedBlock.startTime !== updatedBlock.endTime && hasOverlap(existing, updatedBlock.startTime, updatedBlock.endTime, updatedBlock.id)) {
      toast('Updated schedule overlaps with another planned task.');
      return false;
    }
    const newBlocks = {
      ...plannedBlocks,
      [dateStr]: existing.map(b => b.id === updatedBlock.id ? updatedBlock : b).sort((a, b) => a.startTime - b.startTime)
    };
    await commitPlannerState(newBlocks);
    return true;
  };

  const handleDeletePlannedBlock = async (dateStr: string, blockId: string) => {
    if (!plannedBlocks[dateStr]) return;
    const newBlocks = { ...plannedBlocks, [dateStr]: plannedBlocks[dateStr].filter(b => b.id !== blockId) };
    await commitPlannerState(newBlocks);
    toast('Planned block deleted.', () => {
      performPlannedUndo();
    });
  };

  const handleBatchUpdatePlannedBlocks = async (dateStr: string, updatedBlocks: TimeBlock[]) => {
    if (!plannedBlocks[dateStr]) return;
    const map = new Map(updatedBlocks.map(u => [u.id, u]));
    const newDayBlocks = plannedBlocks[dateStr].map(b => map.get(b.id) || b).sort((a, b) => a.startTime - b.startTime);
    await commitPlannerState({ ...plannedBlocks, [dateStr]: newDayBlocks });
  };

  const handleBatchSavePlannedBlocks = async (dateStr: string, newBlocksArr: TimeBlock[]) => {
    const existing = plannedBlocks[dateStr] || [];
    const merged = [...existing, ...newBlocksArr].sort((a, b) => a.startTime - b.startTime);
    await commitPlannerState({ ...plannedBlocks, [dateStr]: merged });
  };

  const plannedBlockActions: BlockActions = {
    saveBlock: handleSavePlannedBlock,
    updateBlock: handleUpdatePlannedBlock,
    deleteBlock: handleDeletePlannedBlock,
    batchUpdateBlocks: handleBatchUpdatePlannedBlocks,
    batchSaveBlocks: handleBatchSavePlannedBlocks
  };

  const handleSaveDailyNotes = async (dateStr: string, notes: string[]) => {
    const newNotes = { ...dailyNotes, [dateStr]: notes };
    setDailyNotes(newNotes);
    await saveData('dailyNotes', newNotes);
  };

  const handleSaveDailyReflection = async (dateStr: string, reflection: DailyReflection) => {
    const newReflections = { ...dailyReflections, [dateStr]: reflection };
    setDailyReflections(newReflections);
    await saveData('dailyReflections', newReflections);
  };

  const handleSaveGoal = async (key: string, value: string) => {
    const newGoals = { ...goals, [key]: value };
    setGoals(newGoals);
    await saveData('goals', newGoals);
  };

  const noteActions: NoteActions = {
    saveDailyNotes: handleSaveDailyNotes,
    saveDailyReflection: handleSaveDailyReflection
  };

  const plannedNoteActions: NoteActions = {
    saveDailyNotes: async (dateStr: string, notes: string[]) => {
      const newNotes = { ...plannedDailyNotes, [dateStr]: notes };
      setPlannedDailyNotes(newNotes);
      await saveData('plannedDailyNotes', newNotes);
    },
    saveDailyReflection: handleSaveDailyReflection
  };

  const categoryActions: CategoryActions = {
    addCategory: async (name: string, color: string) => {
      const newCats = [...categories, { id: uuidv4(), name, color, lastUsedAt: Date.now() }];
      setCategories(newCats);
      await saveData('categories', newCats);
    },
    updateCategory: async (id: string, name: string, color: string) => {
      const newCats = categories.map(c => c.id === id ? { ...c, name, color } : c);
      setCategories(newCats);
      await saveData('categories', newCats);
    },
    deleteCategory: async (id: string, fallbackId: string) => {
      const newCats = categories.filter(c => c.id !== id);
      setCategories(newCats);
      await saveData('categories', newCats);
      // Cascade fallback
      const cascade = (record: Record<string, TimeBlock[]>) => {
        const next = { ...record };
        Object.keys(next).forEach(d => {
          next[d] = next[d].map(b => (b.categoryId === id || b.category === id) ? { ...b, categoryId: fallbackId, category: fallbackId } : b);
        });
        return next;
      };
      await commitTrackerState(cascade(timeBlocks));
      await commitPlannerState(cascade(plannedBlocks));
    },
    markCategoryUsed: async (id: string) => {
      const newCats = categories.map(c => c.id === id ? { ...c, lastUsedAt: Date.now() } : c);
      setCategories(newCats);
      await saveData('categories', newCats);
    }
  };

  const handleExportMarkdownReport = async () => {
    const todayStr = formatDateKey();
    const blocks = timeBlocks[todayStr] || [];
    const lines = [
      `# LostPulse Chronicle — ${todayStr}`,
      `User: ${userProfile?.name || 'Operator'}`,
      ``,
      `## Recorded Blocks (${blocks.length})`,
      ...blocks.map(b => `- **${b.title}** (${new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
    ];
    const md = lines.join('\n');
    if (window.electronAPI) {
      await window.electronAPI.exportMarkdown(md, `LostPulse-${todayStr}.md`);
      toast(`Exported LostPulse-${todayStr}.md`);
    } else {
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LostPulse-${todayStr}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-white font-mono tracking-widest">
          INITIALIZING SYSTEMS...
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <Onboarding onComplete={handleUpdateProfile} />;
  }

  return (
    <>
      <ProgressionOverlay
        notifications={notifications}
        onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />

      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onSelectWorkspace={handleSelectWorkspace}
        categories={categories}
        onQuickLogBlock={handleSaveBlock}
        onExportMarkdown={handleExportMarkdownReport}
      />

      {/* Global Persistent Active Session Pill */}
      {activeTimerLabel && (
        <button
          onClick={() => handleSelectWorkspace(activeTimerLabel.startsWith('FOCUS:') ? 'planner' : 'tracker')}
          className="fixed top-4 right-4 z-[90] liquid-glass border border-red-500 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl hover:scale-[1.02] transition-transform"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="font-mono text-xs text-white tracking-widest uppercase">{activeTimerLabel}</span>
        </button>
      )}

      {/* Global Background Video (Root level so Chrome backdrop-filter blurs properly) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none bg-black"
        style={{ opacity: 0.7 }}
      >
        <source src="./assets/video/hero4k.mp4" type="video/mp4" />
      </video>

      <main
        ref={mainRef}
        className="relative z-10 w-full h-screen bg-transparent overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop;
          setMainScrollTop(top);
          setIsNavVisible(top > window.innerHeight * 0.5);
        }}
      >
        <section className="snap-start w-full h-screen">
          <HeroSection userProfile={userProfile} scrollTop={mainScrollTop} />
        </section>

        <section className="snap-start w-full min-h-screen relative">
          {activeWorkspace === 'tracker' && (
            <TimeTrackerContainer
              userProfile={userProfile}
              timeBlocks={timeBlocks}
              blockActions={blockActions}
              categories={categories}
              categoryActions={categoryActions}
              dailyNotes={dailyNotes}
              noteActions={noteActions}
            />
          )}
          {activeWorkspace === 'planner' && (
            progression.blueprintUnlocked ? (
              <>
                <FirstTimeGuidance
                  isVisible={!progression.blueprintSeen}
                  title="KRONOS BLUEPRINT"
                  what="A 24-hour visual canvas to schedule your intentions before they happen."
                  why="Because recording the past is only half the equation. To change your life, you must design your future."
                  benefit="Creates intentionality. Reduces in-the-moment decision fatigue by deciding your actions in advance."
                  onDismiss={() => markGuidanceSeen('blueprintSeen')}
                />
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
              </>
            ) : (
              <LockedFeature
                title="System Locked"
                description="This sector of the Kronos System is currently unavailable."
                progress={getMaxHoursInSingleDay(timeBlocks) / 14}
                progressText={`${getMaxHoursInSingleDay(timeBlocks).toFixed(1)} / 14 HOURS IN A SINGLE DAY`}
              />
            )
          )}
          {activeWorkspace === 'report' && (
            progression.epilogueUnlocked ? (
              <>
                <FirstTimeGuidance
                  isVisible={!progression.epilogueSeen}
                  title="EPILOGUE"
                  what="A daily debrief summarizing your actions and emotional alignment."
                  why="Days blur together without reflection. This forces you to close each day consciously."
                  benefit="Creates accountability. Ensures you learn from today before starting tomorrow."
                  onDismiss={() => markGuidanceSeen('epilogueSeen')}
                />
                <DailyReportContainer
                  userProfile={userProfile}
                  timeBlocks={timeBlocks}
                  plannedBlocks={plannedBlocks}
                  categories={categories}
                  dailyReflections={dailyReflections}
                  noteActions={noteActions}
                />
              </>
            ) : (
              <LockedFeature
                title="System Locked"
                description="This sector of the Kronos System is currently unavailable."
                progress={0}
                progressText="0 / 1 COMPLETED DAYS"
              />
            )
          )}
          {activeWorkspace === 'analytics' && (
            progression.chronicleUnlocked ? (
              <>
                <FirstTimeGuidance
                  isVisible={!progression.chronicleSeen}
                  title="CHRONICLE"
                  what="A macro-level view of your time investments over weeks, months, and years."
                  why="Patterns can only be seen from a distance. The Chronicle reveals the truth of your habits."
                  benefit="Provides ultimate clarity. Exposes the difference between what you claim matters and what you actually do."
                  onDismiss={() => markGuidanceSeen('chronicleSeen')}
                />
                <AnalyticsContainer
                  userProfile={userProfile}
                  timeBlocks={timeBlocks}
                  plannedBlocks={plannedBlocks}
                  categories={categories}
                  dailyReflections={dailyReflections}
                  goals={goals}
                  saveGoal={handleSaveGoal}
                />
              </>
            ) : (
              <LockedFeature
                title="System Locked"
                description="This sector of the Kronos System is currently unavailable."
                progress={getCompletedDaysCount(timeBlocks, formatDateKey()) / 7}
                progressText={`${getCompletedDaysCount(timeBlocks, formatDateKey())} / 7 COMPLETED DAYS`}
              />
            )
          )}
          {activeWorkspace === 'settings' && (
            <div className="absolute inset-0 bg-[#0A0A0C]">
              <SettingsContainer
                userProfile={userProfile}
                categories={categories}
                categoryActions={categoryActions}
                timeBlocks={timeBlocks}
                plannedBlocks={plannedBlocks}
                goals={goals}
                onUpdateProfile={handleUpdateProfile}
                onSaveGoal={handleSaveGoal}
                onClose={() => handleSelectWorkspace('tracker')}
              />
            </div>
          )}
        </section>
      </main>

      <FloatingNav
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        isVisible={isNavVisible}
        progressionState={progression}
      />
    </>
  );
}

export default App;