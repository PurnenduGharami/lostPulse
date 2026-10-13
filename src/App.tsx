import { useState, useEffect } from 'react';
import type { UserProfile, TimeBlock, BlockActions, Category, CategoryActions, NoteActions } from './types';
import { loadData, saveData, splitBlockAcrossMidnight } from './utils';
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
import { calculateLifeRemaining, getMaxHoursInSingleDay, getCompletedDaysCount, playPulseChime } from './utils';

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
  const [dailyReflections, setDailyReflections] = useState<Record<string, import('./types').DailyReflection>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useNotification();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>(
    () => (localStorage.getItem('lastWorkspace') as WorkspaceType) || 'tracker'
  );
  const [isNavVisible, setIsNavVisible] = useState(false);
  
  const [progression, setProgression] = useState<import('./types').ProgressionState>({
    hasSeenWelcome: false,
    blueprintUnlocked: false,
    blueprintSeen: false,
    epilogueUnlocked: false,
    epilogueSeen: false,
    chronicleUnlocked: false,
    chronicleSeen: false,
    lastCompletedDayChecked: undefined
  });
  const [notifications, setNotifications] = useState<import('./types').CinematicNotification[]>([]);

  const handleSelectWorkspace = (workspace: WorkspaceType) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('lastWorkspace', workspace);
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  // Time Planner State
  const [plannedBlocks, setPlannedBlocks] = useState<Record<string, TimeBlock[]>>({});
  const [plannedDailyNotes, setPlannedDailyNotes] = useState<Record<string, string[]>>({});
  const [plannedHistory, setPlannedHistory] = useState<string[]>([]);
  const [plannedHistoryIndex, setPlannedHistoryIndex] = useState(-1);

  // Goals State
  const [goals, setGoals] = useState<Record<string, string>>({});

  // Command Palette & Global Indicators
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [mainScrollTop, setMainScrollTop] = useState(0);
  const [activeTimerLabel, setActiveTimerLabel] = useState<string | null>(null);

  // Global Active Session Indicator
  useEffect(() => {
    const timer = setInterval(() => {
      const liveStart = localStorage.getItem('activeSessionStartTime');
      const livePause = localStorage.getItem('activeSessionPauseTime');
      if (liveStart && !livePause) {
        const elapsed = Math.floor((Date.now() - parseInt(liveStart, 10)) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        setActiveTimerLabel(`${pad(mins)}:${pad(secs)}`);
      } else {
        setActiveTimerLabel(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Ctrl+K / Cmd+K Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        loadData<Record<string, import('./types').DailyReflection>>('dailyReflections'),
        loadData<Record<string, string>>('goals'),
        loadData<import('./types').ProgressionState>('progression')
      ]);
      if (profile) {
        setUserProfile(profile);
      }
      if (blocks) {
        setTimeBlocks(blocks);
        setHistory([JSON.stringify(blocks)]);
        setHistoryIndex(0);
      } else {
        setHistory([JSON.stringify({})]);
        setHistoryIndex(0);
      }
      if (notes) {
        setDailyNotes(notes);
      }
      
      if (pBlocks) {
        setPlannedBlocks(pBlocks);
        setPlannedHistory([JSON.stringify(pBlocks)]);
        setPlannedHistoryIndex(0);
      } else {
        setPlannedHistory([JSON.stringify({})]);
        setPlannedHistoryIndex(0);
      }
      if (pNotes) {
        setPlannedDailyNotes(pNotes);
      }

      if (loadedCategories && loadedCategories.length > 0) {
        setCategories(loadedCategories);
      }
      if (reflections) {
        setDailyReflections(reflections);
      }
      if (loadedGoals) {
        setGoals(loadedGoals);
      }
      if (loadedProgression) {
        setProgression(loadedProgression);
      }
      setIsLoaded(true);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    let newProg = { ...progression };
    let changed = false;
    const newNotifications: import('./types').CinematicNotification[] = [];

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

    if (!newProg.blueprintUnlocked) {
      if (getMaxHoursInSingleDay(timeBlocks) >= 14) {
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
    }

    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    if (!newProg.epilogueUnlocked) {
      if (getCompletedDaysCount(timeBlocks, todayStr) >= 1) {
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
    }

    if (!newProg.chronicleUnlocked) {
      if (getCompletedDaysCount(timeBlocks, todayStr) >= 7) {
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
    }

    if (newProg.lastCompletedDayChecked !== todayStr) {
      const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
      
      if (timeBlocks[yesterdayStr] && timeBlocks[yesterdayStr].length > 0) {
         const life = calculateLifeRemaining(userProfile);
         newNotifications.push({
           id: `day_complete_${yesterdayStr}`,
           type: 'day_complete',
           title: 'Day Complete',
           subtitle: `${yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} has become history.`,
           description: `Life Remaining\n\n${life.years} Years\n${life.days} Days\n${life.hours} Hours`,
           actionText: newProg.epilogueUnlocked ? 'Open Epilogue' : 'Continue',
           onAction: newProg.epilogueUnlocked ? () => {
             handleSelectWorkspace('report');
           } : undefined,
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
  }, [timeBlocks, isLoaded, userProfile]);

  const markGuidanceSeen = (key: keyof import('./types').ProgressionState) => {
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

  const pushHistory = (newBlocks: Record<string, TimeBlock[]>) => {
    const currentStateStr = JSON.stringify(newBlocks);
    let newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentStateStr);
    
    // limit history size to 50
    if (newHistory.length > 50) {
      newHistory = newHistory.slice(newHistory.length - 50);
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const pushPlannedHistory = (newBlocks: Record<string, TimeBlock[]>) => {
    const currentStateStr = JSON.stringify(newBlocks);
    let newHistory = plannedHistory.slice(0, plannedHistoryIndex + 1);
    newHistory.push(currentStateStr);
    
    if (newHistory.length > 50) {
      newHistory = newHistory.slice(newHistory.length - 50);
    }
    setPlannedHistory(newHistory);
    setPlannedHistoryIndex(newHistory.length - 1);
  };

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
         return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleSelectWorkspace('settings');
        setTimeout(() => window.dispatchEvent(new CustomEvent('focus-settings-search')), 50);
        return;
      }

      if (e.key === 'Escape') {
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
        if (e.key === 'z') {
           if (e.shiftKey) {
             // Redo
             if (historyIndex < history.length - 1) {
               const nextIndex = historyIndex + 1;
               const state = JSON.parse(history[nextIndex]);
               setTimeBlocks(state);
               setHistoryIndex(nextIndex);
               await saveData('timeBlocks', state);
             }
           } else {
             // Undo
             if (historyIndex > 0) {
               const prevIndex = historyIndex - 1;
               const state = JSON.parse(history[prevIndex]);
               setTimeBlocks(state);
               setHistoryIndex(prevIndex);
               await saveData('timeBlocks', state);
             }
           }
        } else if (e.key === 'y') {
           // Redo
           if (historyIndex < history.length - 1) {
             const nextIndex = historyIndex + 1;
             const state = JSON.parse(history[nextIndex]);
             setTimeBlocks(state);
             setHistoryIndex(nextIndex);
             await saveData('timeBlocks', state);
           }
        }
      }
    };

    const handleUndoPlanned = async () => {
       if (plannedHistoryIndex > 0) {
         const prevIndex = plannedHistoryIndex - 1;
         const state = JSON.parse(plannedHistory[prevIndex]);
         setPlannedBlocks(state);
         setPlannedHistoryIndex(prevIndex);
         await saveData('plannedBlocks', state);
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('undo-planned', handleUndoPlanned as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('undo-planned', handleUndoPlanned as EventListener);
    };
  }, [history, historyIndex, plannedHistory, plannedHistoryIndex]);



  const handleSaveBlock = async (_dateStr: string, block: TimeBlock) => {
    if (block.endTime <= block.startTime || block.endTime - block.startTime <= 0) return;

    const newBlocks = { ...timeBlocks };
    const splitBlocks = splitBlockAcrossMidnight(block);

    for (const [dStr, blocksArr] of Object.entries(splitBlocks)) {
      if (!newBlocks[dStr]) {
        newBlocks[dStr] = [];
      }
      newBlocks[dStr] = [...newBlocks[dStr], ...blocksArr];
      newBlocks[dStr].sort((a, b) => a.startTime - b.startTime);
    }

    pushHistory(newBlocks);
    setTimeBlocks(newBlocks);
    await saveData('timeBlocks', newBlocks);
  };

  const handleUpdateBlock = async (dateStr: string, updatedBlock: TimeBlock) => {
    if (updatedBlock.endTime <= updatedBlock.startTime || updatedBlock.endTime - updatedBlock.startTime <= 0) return;

    const newBlocks = { ...timeBlocks };
    if (!newBlocks[dateStr]) return;
    
    // Remove the old block first
    newBlocks[dateStr] = newBlocks[dateStr].filter(b => b.id !== updatedBlock.id);
    
    // Add the new block(s) which might be split
    const splitBlocks = splitBlockAcrossMidnight(updatedBlock);
    for (const [dStr, blocksArr] of Object.entries(splitBlocks)) {
      if (!newBlocks[dStr]) {
        newBlocks[dStr] = [];
      }
      newBlocks[dStr] = [...newBlocks[dStr], ...blocksArr];
      newBlocks[dStr].sort((a, b) => a.startTime - b.startTime);
    }

    pushHistory(newBlocks);
    setTimeBlocks(newBlocks);
    await saveData('timeBlocks', newBlocks);
  };

  const handleDeleteBlock = async (dateStr: string, blockId: string) => {
    const newBlocks = { ...timeBlocks };
    if (!newBlocks[dateStr]) return;
    newBlocks[dateStr] = newBlocks[dateStr].filter(b => b.id !== blockId);
    pushHistory(newBlocks);
    setTimeBlocks(newBlocks);
    await saveData('timeBlocks', newBlocks);
    toast('Time block deleted.', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    });
  };

  const handleBatchUpdateBlocks = async (dateStr: string, updatedBlocks: TimeBlock[]) => {
    const newBlocks = { ...timeBlocks };
    if (!newBlocks[dateStr]) return;
    
    let modified = false;
    updatedBlocks.forEach(updatedBlock => {
      if (updatedBlock.endTime <= updatedBlock.startTime || updatedBlock.endTime - updatedBlock.startTime <= 0) return;

      const exists = newBlocks[dateStr].some(b => b.id === updatedBlock.id);
      if (exists) {
        // Remove old block
        newBlocks[dateStr] = newBlocks[dateStr].filter(b => b.id !== updatedBlock.id);
        
        // Add new block(s)
        const splitBlocks = splitBlockAcrossMidnight(updatedBlock);
        for (const [dStr, blocksArr] of Object.entries(splitBlocks)) {
          if (!newBlocks[dStr]) {
            newBlocks[dStr] = [];
          }
          newBlocks[dStr] = [...newBlocks[dStr], ...blocksArr];
          newBlocks[dStr].sort((a, b) => a.startTime - b.startTime);
        }
        modified = true;
      }
    });
    
    if (modified) {
      pushHistory(newBlocks);
      setTimeBlocks(newBlocks);
      await saveData('timeBlocks', newBlocks);
    }
  };

  const blockActions: BlockActions = {
    saveBlock: handleSaveBlock,
    updateBlock: handleUpdateBlock,
    deleteBlock: handleDeleteBlock,
    batchUpdateBlocks: handleBatchUpdateBlocks
  };

  const handleSavePlannedBlock = async (dateStr: string, block: TimeBlock) => {
    const newBlocks = { ...plannedBlocks };
    if (!newBlocks[dateStr]) newBlocks[dateStr] = [];
    const updatedDayBlocks = [...newBlocks[dateStr], block];
    updatedDayBlocks.sort((a, b) => a.startTime - b.startTime);
    newBlocks[dateStr] = updatedDayBlocks;
    pushPlannedHistory(newBlocks);
    setPlannedBlocks(newBlocks);
    await saveData('plannedBlocks', newBlocks);
  };

  const handleUpdatePlannedBlock = async (dateStr: string, updatedBlock: TimeBlock) => {
    const newBlocks = { ...plannedBlocks };
    if (!newBlocks[dateStr]) return;
    const index = newBlocks[dateStr].findIndex(b => b.id === updatedBlock.id);
    if (index !== -1) {
      newBlocks[dateStr][index] = updatedBlock;
      pushPlannedHistory(newBlocks);
      setPlannedBlocks(newBlocks);
      await saveData('plannedBlocks', newBlocks);
    }
  };

  const handleDeletePlannedBlock = async (dateStr: string, blockId: string) => {
    const newBlocks = { ...plannedBlocks };
    if (!newBlocks[dateStr]) return;
    newBlocks[dateStr] = newBlocks[dateStr].filter(b => b.id !== blockId);
    pushPlannedHistory(newBlocks);
    setPlannedBlocks(newBlocks);
    await saveData('plannedBlocks', newBlocks);
    toast('Planned block deleted.', () => {
      // For planned blocks, history index is separate, so we might need a custom event
      // or just do the undo inline. Let's do a custom event to trigger planned undo.
      window.dispatchEvent(new CustomEvent('undo-planned'));
    });
  };

  const handleBatchUpdatePlannedBlocks = async (dateStr: string, updatedBlocks: TimeBlock[]) => {
    const newBlocks = { ...plannedBlocks };
    if (!newBlocks[dateStr]) return;
    let modified = false;
    updatedBlocks.forEach(updatedBlock => {
      const index = newBlocks[dateStr].findIndex(b => b.id === updatedBlock.id);
      if (index !== -1) {
        newBlocks[dateStr][index] = updatedBlock;
        modified = true;
      }
    });
    if (modified) {
      newBlocks[dateStr].sort((a, b) => a.startTime - b.startTime);
      pushPlannedHistory(newBlocks);
      setPlannedBlocks(newBlocks);
      await saveData('plannedBlocks', newBlocks);
    }
  };

  const handleBatchSavePlannedBlocks = async (dateStr: string, newBlocksArr: TimeBlock[]) => {
    const newBlocks = { ...plannedBlocks };
    if (!newBlocks[dateStr]) newBlocks[dateStr] = [];
    newBlocks[dateStr] = [...newBlocks[dateStr], ...newBlocksArr];
    newBlocks[dateStr].sort((a, b) => a.startTime - b.startTime);
    
    pushPlannedHistory(newBlocks);
    setPlannedBlocks(newBlocks);
    await saveData('plannedBlocks', newBlocks);
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

  const handleSaveDailyReflection = async (dateStr: string, reflection: import('./types').DailyReflection) => {
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

  const handleSavePlannedDailyNotes = async (dateStr: string, notes: string[]) => {
    const newNotes = { ...plannedDailyNotes, [dateStr]: notes };
    setPlannedDailyNotes(newNotes);
    await saveData('plannedDailyNotes', newNotes);
  };

  const plannedNoteActions: NoteActions = {
    saveDailyNotes: handleSavePlannedDailyNotes,
    saveDailyReflection: handleSaveDailyReflection // Fallback or explicitly shared
  };

  const handleAddCategory = async (name: string, color: string) => {
    const newCat: Category = { id: uuidv4(), name, color, lastUsedAt: Date.now() };
    const newCats = [...categories, newCat];
    setCategories(newCats);
    await saveData('categories', newCats);
  };

  const handleUpdateCategory = async (id: string, name: string, color: string) => {
    const newCats = categories.map(c => c.id === id ? { ...c, name, color } : c);
    setCategories(newCats);
    await saveData('categories', newCats);
  };

  const handleDeleteCategory = async (id: string, fallbackId: string) => {
    const newCats = categories.filter(c => c.id !== id);
    setCategories(newCats);
    await saveData('categories', newCats);

    // Cascade update to blocks
    const newBlocks = { ...timeBlocks };
    let changed = false;
    Object.keys(newBlocks).forEach(dateStr => {
      newBlocks[dateStr] = newBlocks[dateStr].map(b => {
        if (b.categoryId === id || b.category === id) {
          changed = true;
          return { ...b, categoryId: fallbackId, category: fallbackId };
        }
        return b;
      });
    });
    if (changed) {
      setTimeBlocks(newBlocks);
      await saveData('timeBlocks', newBlocks);
    }

    const newPlannedBlocks = { ...plannedBlocks };
    let plannedChanged = false;
    Object.keys(newPlannedBlocks).forEach(dateStr => {
      newPlannedBlocks[dateStr] = newPlannedBlocks[dateStr].map(b => {
        if (b.categoryId === id || b.category === id) {
          plannedChanged = true;
          return { ...b, categoryId: fallbackId, category: fallbackId };
        }
        return b;
      });
    });
    if (plannedChanged) {
      setPlannedBlocks(newPlannedBlocks);
      await saveData('plannedBlocks', newPlannedBlocks);
    }
  };

  const handleMarkCategoryUsed = async (id: string) => {
    const newCats = categories.map(c => c.id === id ? { ...c, lastUsedAt: Date.now() } : c);
    setCategories(newCats);
    await saveData('categories', newCats);
  };

  const categoryActions: CategoryActions = {
    addCategory: handleAddCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    markCategoryUsed: handleMarkCategoryUsed
  };

  const handleQuickLogBlock = async (dateStr: string, block: TimeBlock): Promise<boolean> => {
    blockActions.saveBlock(dateStr, block);
    playPulseChime();
    toast(`Time Block Logged: "${block.title}" recorded for ${dateStr}.`);
    return true;
  };

  const handleExportMarkdown = async () => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const blocks = timeBlocks[todayStr] || [];
    
    let md = `# LOST PULSE CHRONICLE - ${todayStr}\n\n`;
    md += `## Time Blocks\n`;
    if (blocks.length === 0) {
      md += `*No blocks recorded for this date.*\n`;
    } else {
      blocks.forEach(b => {
        const start = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const end = new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const cat = categories.find(c => c.id === b.categoryId)?.name || b.category || 'Uncategorized';
        md += `- **${start} - ${end}**: ${b.title} [${cat}]\n`;
        if (b.description) md += `  - *${b.description}*\n`;
      });
    }

    if (dailyNotes[todayStr]?.length) {
      md += `\n## Daily Notes\n`;
      dailyNotes[todayStr].forEach(n => {
        md += `- ${n}\n`;
      });
    }

    if (window.electronAPI?.exportMarkdown) {
      await window.electronAPI.exportMarkdown(md, `lostpulse_${todayStr}.md`);
      toast(`Export Complete: Saved lostpulse_${todayStr}.md via desktop storage.`);
    } else {
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lostpulse_${todayStr}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Chronicle Exported: Downloaded lostpulse_${todayStr}.md`);
    }
  };



  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-neutral-500 font-mono tracking-widest">
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
        className="relative z-10 w-full h-screen bg-transparent overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        onScroll={(e) => {
          setIsNavVisible(e.currentTarget.scrollTop > window.innerHeight * 0.5);
          setMainScrollTop(e.currentTarget.scrollTop);
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
                progressText={`0 / 1 COMPLETED DAYS`}
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
                progress={getCompletedDaysCount(timeBlocks, `${new Date().getFullYear()}-${(new Date().getMonth()+1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`) / 7}
                progressText={`${getCompletedDaysCount(timeBlocks, `${new Date().getFullYear()}-${(new Date().getMonth()+1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`)} / 7 COMPLETED DAYS`}
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

      {activeTimerLabel && (
        <button
          onClick={() => handleSelectWorkspace('tracker')}
          className="fixed top-6 right-6 z-40 liquid-glass border border-red-500/40 rounded-full px-3.5 py-1.5 flex items-center gap-2.5 shadow-lg hover:border-red-500 transition-all cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-xs font-bold text-white tracking-widest">{activeTimerLabel}</span>
          <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider group-hover:text-red-400 transition-colors">REC</span>
        </button>
      )}

      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onSelectWorkspace={handleSelectWorkspace}
        categories={categories}
        onQuickLogBlock={handleQuickLogBlock}
        onExportMarkdown={handleExportMarkdown}
      />
    </>
  );
}

export default App;
