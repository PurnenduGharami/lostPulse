import { useState } from 'react';
import type { UserProfile, TimeBlock, Category } from '../types';
import LiquidSelect from './LiquidSelect';
import AnalyticsOverview from './AnalyticsOverview';
import AnalyticsAnalysis from './AnalyticsAnalysis';
import AnalyticsReport from './AnalyticsReport';
import CustomDatePicker from './CustomDatePicker';

interface AnalyticsContainerProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  plannedBlocks: Record<string, TimeBlock[]>;
  categories: Category[];
  dailyReflections: Record<string, import('../types').DailyReflection>;
  goals: Record<string, string>;
  saveGoal: (key: string, value: string) => Promise<void>;
}

export type TimeRange = 'weekly' | 'monthly' | '3-months' | '6-months' | 'yearly';

export default function AnalyticsContainer({
  userProfile,
  timeBlocks,
  plannedBlocks,
  categories,
  dailyReflections,
  goals,
  saveGoal
}: AnalyticsContainerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'report'>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');
  const [anchorDateMs, setAnchorDateMs] = useState(Date.now());

  const getPeriodLabel = () => {
    const d = new Date(anchorDateMs);
    if (timeRange === 'weekly') {
      // Need a simple week label
      return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (timeRange === 'monthly') {
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (timeRange === 'yearly') {
      return d.getFullYear().toString();
    }
    if (timeRange === '3-months') {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `Q${q} ${d.getFullYear()}`;
    }
    if (timeRange === '6-months') {
      const half = d.getMonth() < 6 ? 'H1' : 'H2';
      return `${half} ${d.getFullYear()}`;
    }
    return '';
  };

  const handlePrevPeriod = () => {
    const d = new Date(anchorDateMs);
    if (timeRange === 'weekly') d.setDate(d.getDate() - 7);
    else if (timeRange === 'monthly') d.setMonth(d.getMonth() - 1);
    else if (timeRange === '3-months') d.setMonth(d.getMonth() - 3);
    else if (timeRange === '6-months') d.setMonth(d.getMonth() - 6);
    else if (timeRange === 'yearly') d.setFullYear(d.getFullYear() - 1);
    setAnchorDateMs(d.getTime());
  };

  const handleNextPeriod = () => {
    const d = new Date(anchorDateMs);
    if (timeRange === 'weekly') d.setDate(d.getDate() + 7);
    else if (timeRange === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (timeRange === '3-months') d.setMonth(d.getMonth() + 3);
    else if (timeRange === '6-months') d.setMonth(d.getMonth() + 6);
    else if (timeRange === 'yearly') d.setFullYear(d.getFullYear() + 1);
    
    if (d.getTime() > Date.now()) {
      setAnchorDateMs(Date.now());
    } else {
      setAnchorDateMs(d.getTime());
    }
  };

  return (
    <div className="w-full h-full relative liquid-glass flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col h-full bg-[#0a0a0c]/90">
        <header className="flex-shrink-0 p-4 sm:p-6 md:p-8 border-b border-[#333333] flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              <h1 className="font-cinzel text-lg sm:text-xl md:text-2xl text-white tracking-widest uppercase m-0 whitespace-nowrap">CHRONICLE</h1>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <LiquidSelect
                  value={timeRange}
                  onChange={(val) => setTimeRange(val as TimeRange)}
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: '3-months', label: 'Quarterly' },
                    { value: '6-months', label: 'Half-Yearly' },
                    { value: 'yearly', label: 'Yearly' }
                  ]}
                />

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrevPeriod}
                    className="text-[#555] hover:text-white transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  
                  <CustomDatePicker 
                    currentDate={new Date(anchorDateMs).toISOString().split('T')[0]}
                    onChange={(d) => setAnchorDateMs(new Date(d).getTime())}
                  />
                  <span className="font-mono text-white text-xs uppercase tracking-widest min-w-[80px] sm:min-w-[120px] text-center">
                    {getPeriodLabel()}
                  </span>
                  <button 
                    onClick={handleNextPeriod}
                    disabled={new Date(anchorDateMs).getTime() >= Date.now() - 86400000}
                    className="text-[#888] hover:text-white transition-colors px-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-0 sm:space-x-4">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-3 sm:px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] ${activeTab === 'overview' ? 'border-red-500/50 text-red-500 font-bold' : 'text-white'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-3 sm:px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] ${activeTab === 'analysis' ? 'border-red-500/50 text-red-500 font-bold' : 'text-white'}`}
              >
                Analysis
              </button>
              <button 
                onClick={() => setActiveTab('report')}
                className={`px-3 sm:px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] ${activeTab === 'report' ? 'border-red-500/50 text-red-500 font-bold' : 'text-white'}`}
              >
                Report
              </button>
            </div>
          </div>
          
          {/* Goal Input removed from here */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          {activeTab === 'overview' && (
            <AnalyticsOverview 
              userProfile={userProfile}
              timeBlocks={timeBlocks}
              plannedBlocks={plannedBlocks}
              categories={categories}
              dailyReflections={dailyReflections}
              timeRange={timeRange}
              anchorDateMs={anchorDateMs}
              goals={goals}
              saveGoal={saveGoal}
              getPeriodLabel={getPeriodLabel}
            />
          )}
          {activeTab === 'analysis' && (
            <AnalyticsAnalysis 
              userProfile={userProfile}
              timeBlocks={timeBlocks}
              plannedBlocks={plannedBlocks}
              categories={categories}
              dailyReflections={dailyReflections}
              timeRange={timeRange}
              anchorDateMs={anchorDateMs}
            />
          )}
          {activeTab === 'report' && (
            <AnalyticsReport 
              userProfile={userProfile}
              timeBlocks={timeBlocks}
              plannedBlocks={plannedBlocks}
              categories={categories}
              dailyReflections={dailyReflections}
              timeRange={timeRange}
              anchorDateMs={anchorDateMs}
            />
          )}
        </main>
      </div>
    </div>
  );
}
