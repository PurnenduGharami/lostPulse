import React, { useState } from 'react';
import type { TimeBlock, UserProfile, BlockActions, Category, CategoryActions, NoteActions } from '../types';
import RetrospectiveGrid from './RetrospectiveGrid';
import LiveSession from './LiveSession';
import CustomDatePicker from './CustomDatePicker';
import TimeJournal from './TimeJournal';
import OverviewTab from './OverviewTab';

interface TimeTrackerContainerProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  blockActions: BlockActions;
  categories: Category[];
  categoryActions: CategoryActions;
  dailyNotes: Record<string, string[]>;
  noteActions: NoteActions;
}

type TabType = 'overview' | 'retrospective' | 'live' | 'journal';

export default function TimeTrackerContainer({ userProfile, timeBlocks, blockActions, categories, categoryActions, dailyNotes, noteActions }: TimeTrackerContainerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [scrollMap, setScrollMap] = useState<Record<string, number>>({});

  const [currentDate, setCurrentDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  // Hoisted TimeJournal Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilterId, setCategoryFilterId] = useState('');
  const [notesFilter, setNotesFilter] = useState(false);
  const [favoritesFilter, setFavoritesFilter] = useState(false);
  const [dateMode, setDateMode] = useState<'all' | 'today' | 'this_week' | 'this_month'>('all');

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
    if (tab === 'live') {
      setCurrentDate(getTodayStr());
    }
  };

  React.useEffect(() => {
    const handleOpenEditBlock = (e: CustomEvent<{ blockId: string, source: 'planner' | 'tracker' }>) => {
      if (e.detail.source === 'tracker') {
        let foundDate = '';
        let foundBlock: TimeBlock | null = null;
        Object.entries(timeBlocks).forEach(([date, blocks]) => {
          const b = blocks.find(b => b.id === e.detail.blockId);
          if (b) { foundDate = date; foundBlock = b; }
        });
        if (foundDate && foundBlock) {
          setCurrentDate(foundDate);
          setActiveTab('retrospective');
          document.getElementById('tracker-section')?.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-edit-block-direct', { detail: { block: foundBlock } }));
          }, 100);
        }
      }
    };
    window.addEventListener('open-edit-block', handleOpenEditBlock as EventListener);
    return () => window.removeEventListener('open-edit-block', handleOpenEditBlock as EventListener);
  }, [timeBlocks]);

  return (
    <div id="tracker-section" className="relative w-full h-[100vh] max-w-none p-4 sm:p-6 lg:p-10 liquid-glass overflow-hidden flex flex-col rounded-none border-none">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-8">
          <h2 className="font-serif text-xl sm:text-2xl text-white font-bold tracking-wide whitespace-nowrap">
            {activeTab === 'journal' ? 'KRONOS SCRIPT' : 'KRONOS RECORD'}
          </h2>
          <div className={`flex items-center space-x-2 sm:space-x-4 transition-opacity ${activeTab === 'journal' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button 
              onClick={() => handleDateChange(-1)}
              className="text-white hover:text-white transition-colors font-mono text-sm px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              &lt;
            </button>
            <CustomDatePicker 
              currentDate={currentDate} 
              onChange={setCurrentDate} 
              maxDate={getTodayStr()} 
              dailyNotes={dailyNotes}
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
              disabled={isToday()}
              className={`font-mono text-sm transition-colors px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center ${isToday() ? 'text-[#222222] cursor-not-allowed' : 'text-white hover:text-white'}`}
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
            Live Session
          </button>
          <button 
            onClick={() => handleTabChange('journal')}
            className={`px-3 sm:px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] ${activeTab === 'journal' ? 'border-red-500/50 text-red-500 font-bold' : 'text-white'}`}
          >
            Script
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative overflow-hidden">
        {activeTab === 'overview' && (
          <OverviewTab 
            userProfile={userProfile}
            timeBlocks={timeBlocks} 
            categories={categories} 
            dailyNotes={dailyNotes}
            currentDate={currentDate}
          />
        )}
        {activeTab === 'retrospective' && (
          <RetrospectiveGrid 
            timeBlocks={timeBlocks} 
            blockActions={blockActions} 
            currentDate={currentDate} 
            categories={categories} 
            categoryActions={categoryActions} 
            scrollMap={scrollMap}
            setScrollMap={setScrollMap}
            dailyNotes={dailyNotes}
            noteActions={noteActions}
          />
        )}
        {activeTab === 'live' && (
          <LiveSession userProfile={userProfile} blockActions={blockActions} categories={categories} categoryActions={categoryActions} />
        )}
        {activeTab === 'journal' && (
          <TimeJournal 
            timeBlocks={timeBlocks} 
            blockActions={blockActions} 
            categories={categories} 
            categoryActions={categoryActions} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            categoryFilterId={categoryFilterId}
            setCategoryFilterId={setCategoryFilterId}
            notesFilter={notesFilter}
            setNotesFilter={setNotesFilter}
            favoritesFilter={favoritesFilter}
            setFavoritesFilter={setFavoritesFilter}
            dateMode={dateMode}
            setDateMode={setDateMode}
          />
        )}
      </div>
    </div>
  );
}
