import { useState, useEffect } from 'react';
import { getBlocksForDay } from '../utils';
import type { TimeBlock, UserProfile, BlockActions, Category, CategoryActions, NoteActions } from '../types';
import PlannerGrid from './PlannerGrid';
import FocusSession from './FocusSession';
import CustomDatePicker from './CustomDatePicker';
import DailyPlanner from './DailyPlanner';
import PlannerOverviewTab from './PlannerOverviewTab';

interface TimeTrackerContainerProps {
  userProfile: UserProfile;
  plannedBlocks: Record<string, TimeBlock[]>;
  plannedBlockActions: BlockActions;
  categories: Category[];
  categoryActions: CategoryActions;
  plannedDailyNotes: Record<string, string[]>;
  plannedNoteActions: NoteActions;
  trackerBlockActions: BlockActions;
}

type TabType = 'overview' | 'retrospective' | 'live' | 'journal';

export default function TimePlannerContainer({ userProfile, plannedBlocks, plannedBlockActions, categories, categoryActions, plannedDailyNotes, plannedNoteActions, trackerBlockActions }: TimeTrackerContainerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [scrollMap, setScrollMap] = useState<Record<string, number>>({});

  const [currentDate, setCurrentDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const getTodayStr = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const isToday = () => currentDate === getTodayStr();

  const handleDateChange = (daysOffset: number) => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + daysOffset);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setCurrentDate(`${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  
  const blocks = getBlocksForDay(plannedBlocks, currentDate);
  let plannedMs = 0;
  blocks.forEach(b => {
    if (b.startTime !== b.endTime) {
      plannedMs += (b.endTime - b.startTime);
    }
  });
  const isFullyPlanned = plannedMs >= 24 * 3600000;

  useEffect(() => {
    if (isFullyPlanned) {
      const shownKey = `planner_completion_${currentDate}`;
      if (!localStorage.getItem(shownKey)) {
        setShowCompletionOverlay(true);
        localStorage.setItem(shownKey, 'true');
      }
    }
  }, [isFullyPlanned, currentDate]);

  const handleStartFocus = (task: TimeBlock) => {
    localStorage.setItem('focusSessionTaskId', task.id);
    localStorage.setItem('focusSessionTitle', task.title);
    localStorage.setItem('focusSessionDesc', task.description || '');
    localStorage.setItem('focusSessionCategory', task.categoryId || 'uncategorized');
    localStorage.setItem('focusSessionStartTime', Date.now().toString());
    sessionStorage.setItem('focusSessionRecovered', 'true');
    
    plannedBlockActions.updateBlock(currentDate, { ...task, status: 'In Progress' });
    setActiveTab('live');
  };

  useEffect(() => {
    const handleOpenEditBlock = (e: CustomEvent<{ blockId: string, source: 'planner' | 'tracker' }>) => {
      if (e.detail.source === 'planner') {
        let foundDate = '';
        let foundBlock: TimeBlock | null = null;
        Object.entries(plannedBlocks).forEach(([date, blocks]) => {
          const b = blocks.find(b => b.id === e.detail.blockId);
          if (b) { foundDate = date; foundBlock = b; }
        });
        if (foundDate && foundBlock) {
          setCurrentDate(foundDate);
          setActiveTab('retrospective'); // This is the planner grid view!
          document.getElementById('planner-section')?.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-edit-planner-block-direct', { detail: { block: foundBlock } }));
          }, 100);
        }
      }
    };
    window.addEventListener('open-edit-block', handleOpenEditBlock as EventListener);
    return () => window.removeEventListener('open-edit-block', handleOpenEditBlock as EventListener);
  }, [plannedBlocks]);

  return (
    <div id="planner-section" className="relative w-full h-[100vh] max-w-none p-4 sm:p-6 lg:p-10 liquid-glass overflow-hidden flex flex-col rounded-none border-none">
      
      {showCompletionOverlay && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCompletionOverlay(false)}></div>
          <div className="relative w-full max-w-2xl liquid-panel p-8 sm:p-12 rounded-md text-center">
            <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold mb-6">Congratulations.</h2>
            <p className="text-lg sm:text-xl font-serif text-[#cccccc] mb-8">
              You planned your entire day.
            </p>
            <div className="border-t border-b border-white/10 py-6 sm:py-8 mb-8">
              <p className="text-xl sm:text-2xl font-serif text-red-500 italic">
                If today were your last day, would you still be happy with this plan?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:space-x-6">
              <button 
                onClick={() => setShowCompletionOverlay(false)}
                className="w-full sm:w-auto px-8 py-3 bg-[#8B0000] hover:bg-[#ff2222] text-white font-mono uppercase tracking-widest text-xs transition-colors rounded-sm min-h-[44px]"
              >
                Yes, Keep My Plan
              </button>
              <button 
                onClick={() => {
                  setShowCompletionOverlay(false);
                  setActiveTab('overview');
                }}
                className="w-full sm:w-auto px-8 py-3 liquid-button text-[#aaaaaa] hover:text-white font-mono uppercase tracking-widest text-xs min-h-[44px]"
              >
                Review My Plan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-8">
          <h2 className="font-serif text-xl sm:text-2xl text-white font-bold tracking-wide whitespace-nowrap">
            {activeTab === 'journal' ? 'Blueprint' : 'KRONOS BLUEPRINT'}
          </h2>
          <div className="flex items-center space-x-2 sm:space-x-4 transition-opacity opacity-100">
            <button 
              onClick={() => handleDateChange(-1)}
              className="text-white hover:text-white transition-colors font-mono text-sm px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              &lt;
            </button>
            <CustomDatePicker 
              currentDate={currentDate} 
              onChange={setCurrentDate} 
              minDate={getTodayStr()} 
              dailyNotes={plannedDailyNotes}
            />
            {!isToday() && (
              <button 
                onClick={() => setCurrentDate(getTodayStr())}
                className="text-[10px] uppercase font-mono text-[#aaaaaa] hover:text-white underline tracking-widest px-2 py-1"
              >
                Today
              </button>
            )}
            <button 
              onClick={() => handleDateChange(1)}
              className="font-mono text-sm transition-colors px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-white hover:text-white"
            >
              &gt;
            </button>
          </div>
        </div>
        
        {/* Minimalist Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-0 sm:space-x-4">
          <button 
            onClick={() => handleTabChange('overview')}
            className={`px-3 sm:px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] ${activeTab === 'overview' ? 'border-red-500/50 text-red-500 font-bold' : 'text-white'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => handleTabChange('retrospective')}
            className={`px-3 sm:px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] ${activeTab === 'retrospective' ? 'border-red-500/50 text-red-500 font-bold' : 'text-white'}`}
          >
            Grid Entry
          </button>
          <button 
            onClick={() => handleTabChange('live')}
            className={`px-3 sm:px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] ${activeTab === 'live' ? 'border-red-500/50 text-red-500 font-bold' : 'text-white'}`}
          >
            Focus
          </button>
          <button 
            onClick={() => handleTabChange('journal')}
            className={`px-3 sm:px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] ${activeTab === 'journal' ? 'border-red-500/50 text-red-500 font-bold' : 'text-white'}`}
          >
            Blueprint
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative overflow-hidden">
        {activeTab === 'overview' && (
          <PlannerOverviewTab 
            userProfile={userProfile}
            timeBlocks={plannedBlocks} 
            categories={categories} 
            dailyNotes={plannedDailyNotes}
            currentDate={currentDate}
          />
        )}
        {activeTab === 'retrospective' && (
          <PlannerGrid 
            timeBlocks={plannedBlocks} 
            blockActions={plannedBlockActions} 
            currentDate={currentDate} 
            categories={categories} 
            categoryActions={categoryActions} 
            scrollMap={scrollMap}
            setScrollMap={setScrollMap}
            dailyNotes={plannedDailyNotes}
            noteActions={plannedNoteActions}
            onStartFocus={handleStartFocus}
            trackerBlockActions={trackerBlockActions}
          />
        )}
        {activeTab === 'live' && (
          <FocusSession userProfile={userProfile} timeBlocks={plannedBlocks} blockActions={plannedBlockActions} categories={categories} categoryActions={categoryActions} trackerBlockActions={trackerBlockActions} />
        )}
        {activeTab === 'journal' && (
          <DailyPlanner 
            timeBlocks={plannedBlocks} 
            blockActions={plannedBlockActions} 
            categories={categories} 
            categoryActions={categoryActions} 
            dailyNotes={plannedDailyNotes}
            noteActions={plannedNoteActions}
            currentDate={currentDate}
            onStartFocus={handleStartFocus}
            trackerBlockActions={trackerBlockActions}
          />
        )}
      </div>
    </div>
  );
}
