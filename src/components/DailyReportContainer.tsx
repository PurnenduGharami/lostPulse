import { useState, useMemo } from 'react';
import type { UserProfile, TimeBlock, Category, NoteActions, DailyReflection } from '../types';
import { getBlocksForDay } from '../utils';
import DailyReportOverview from './DailyReportOverview';
import DailyReportInsights from './DailyReportInsights';
import CustomDatePicker from './CustomDatePicker';

interface DailyReportContainerProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  plannedBlocks: Record<string, TimeBlock[]>;
  categories: Category[];
  dailyReflections: Record<string, DailyReflection>;
  noteActions: NoteActions;
}

export default function DailyReportContainer({
  userProfile,
  timeBlocks,
  plannedBlocks,
  categories,
  dailyReflections,
  noteActions
}: DailyReportContainerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
  
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [selectedDate, setSelectedDate] = useState(getYesterdayStr());
  
  // Calculate max date (yesterday) for the date picker
  const maxDateStr = getYesterdayStr();

  const [y, m, d] = selectedDate.split('-').map(Number);
  const baseDateMs = new Date(y, m - 1, d, 0, 0, 0).getTime();

  const blocksForDay = useMemo(() => getBlocksForDay(timeBlocks, selectedDate), [timeBlocks, selectedDate]);
  const plannedBlocksForDay = useMemo(() => getBlocksForDay(plannedBlocks, selectedDate), [plannedBlocks, selectedDate]);

  const handlePrevDay = () => {
    const dateObj = new Date(y, m - 1, d - 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setSelectedDate(`${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`);
  };

  const handleNextDay = () => {
    if (selectedDate >= maxDateStr) return; // Cap at yesterday
    const dateObj = new Date(y, m - 1, d + 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setSelectedDate(`${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`);
  };

  return (
    <div className="w-full h-full relative liquid-glass flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col h-full bg-[#0a0a0c]/90">
        <header className="flex-shrink-0 p-4 sm:p-6 md:p-8 border-b border-[#333333] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <h1 className="font-cinzel text-lg sm:text-xl md:text-2xl text-white tracking-widest uppercase m-0 whitespace-nowrap">EPILOGUE</h1>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={handlePrevDay}
                className="text-[#555] hover:text-white transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Previous Day"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <CustomDatePicker 
                currentDate={selectedDate}
                onChange={setSelectedDate}
                maxDate={maxDateStr}
              />

              <button 
                onClick={handleNextDay}
                disabled={selectedDate >= maxDateStr}
                className={`p-1 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${selectedDate >= maxDateStr ? 'text-[#333] cursor-not-allowed' : 'text-[#555] hover:text-white cursor-pointer'}`}
                aria-label="Next Day"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
          
          <div className="flex space-x-6 border-b border-white/5 pb-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`font-mono text-xs uppercase tracking-widest transition-colors min-h-[44px] ${activeTab === 'overview' ? 'text-white' : 'text-[#555555] hover:text-white/80'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={`font-mono text-xs uppercase tracking-widest transition-colors min-h-[44px] ${activeTab === 'insights' ? 'text-white' : 'text-[#555555] hover:text-white/80'}`}
            >
              Insights
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar relative">
          {activeTab === 'overview' ? (
            <DailyReportOverview 
              userProfile={userProfile}
              plannedBlocks={plannedBlocksForDay}
              trackedBlocks={blocksForDay}
              categories={categories}
              baseDateMs={baseDateMs}
              reflection={dailyReflections[selectedDate]}
            />
          ) : (
            <DailyReportInsights 
              dateStr={selectedDate}
              plannedBlocks={plannedBlocksForDay}
              trackedBlocks={blocksForDay}
              categories={categories}
              reflection={dailyReflections[selectedDate]}
              onSaveReflection={noteActions.saveDailyReflection}
            />
          )}
        </main>
      </div>
    </div>
  );
}
