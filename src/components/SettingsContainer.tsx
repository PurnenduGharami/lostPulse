import React, { useState } from 'react';
import type { ReactNode } from 'react';
import type { UserProfile, Category, CategoryActions, TimeBlock } from '../types';
import SettingsProfile from './SettingsProfile';
import SettingsGoals from './SettingsGoals';
import SettingsCategories from './SettingsCategories';
import SettingsData from './SettingsData';
import SettingsShortcuts from './SettingsShortcuts';

interface SettingsContainerProps {
  userProfile: UserProfile;
  categories: Category[];
  categoryActions: CategoryActions;
  timeBlocks: Record<string, TimeBlock[]>;
  plannedBlocks: Record<string, TimeBlock[]>;
  goals: Record<string, string>;
  onUpdateProfile: (profile: UserProfile) => void;
  onSaveGoal: (key: string, value: string) => Promise<void>;
  onClose: () => void;
}

type SettingsTab = 
  | 'profile' | 'goals' | 'categories' | 'data' | 'shortcuts';

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'goals', label: 'Life Goals', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
  { id: 'categories', label: 'Category Manager', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: 'data', label: 'Data Management', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
  { id: 'shortcuts', label: 'Shortcuts Guide', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg> },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SettingsContainer({ 
  userProfile, 
  categories, 
  categoryActions,
  timeBlocks,
  plannedBlocks,
  goals,
  onUpdateProfile,
  onSaveGoal,
  onClose 
}: SettingsContainerProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleFocus = () => {
      searchInputRef.current?.focus();
    };
    window.addEventListener('focus-settings-search', handleFocus);
    return () => window.removeEventListener('focus-settings-search', handleFocus);
  }, []);

  const filteredTabs = SETTINGS_TABS.filter(tab => 
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-full liquid-glass rounded-xl border border-[#333] shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black text-[#888] hover:text-white transition-colors border border-white/5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Sidebar */}
        <div className="w-full md:w-64 h-auto md:h-full flex-shrink-0 border-b md:border-b-0 md:border-r border-[#333] flex flex-col bg-[#0a0a0c]/50">
          <div className="p-4 border-b border-[#333]/50 hidden md:block">
            <h2 className="font-cinzel text-xl text-white tracking-widest uppercase mb-4 px-2">Settings</h2>
            <div className="relative px-2">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#555]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="SEARCH... (CTRL+K)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-md pl-9 pr-3 py-2 text-xs text-white font-mono placeholder:text-[#555] focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto p-2 md:p-3 space-x-2 md:space-x-0 md:space-y-1 custom-scrollbar">
            {filteredTabs.length === 0 ? (
              <div className="text-center p-4 text-[#555] font-mono text-[10px] uppercase tracking-widest">No results found</div>
            ) : filteredTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-md text-[10px] sm:text-xs md:text-sm font-mono tracking-wider transition-all duration-200 min-h-[44px] sm:min-h-0 ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/5' 
                    : 'text-[#888] hover:bg-white/5 hover:text-[#ccc] border border-transparent'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-red-500' : 'text-[#666]'}>
                  {tab.icon}
                </span>
                <span className="uppercase text-[9px] sm:text-[11px]">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 h-full bg-[#0a0a0c]/90 overflow-hidden relative">
          {/* Header */}
          <header className="h-20 border-b border-[#333] flex items-center px-8 flex-shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs text-[#888] uppercase tracking-widest">
              <span>Settings</span>
              <span>/</span>
              <span className="text-white">{SETTINGS_TABS.find(t => t.id === activeTab)?.label}</span>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="absolute inset-0 top-20 overflow-y-auto custom-scrollbar p-8">
            {activeTab === 'profile' && (
              <SettingsProfile userProfile={userProfile} onUpdateProfile={onUpdateProfile} goals={goals} onSaveGoal={onSaveGoal} />
            )}
            {activeTab === 'goals' && (
              <SettingsGoals userProfile={userProfile} onUpdateProfile={onUpdateProfile} />
            )}
            {activeTab === 'categories' && (
              <SettingsCategories 
                categories={categories} 
                categoryActions={categoryActions} 
                timeBlocks={timeBlocks} 
                plannedBlocks={plannedBlocks} 
              />
            )}
            {activeTab === 'data' && (
              <SettingsData />
            )}
            {activeTab === 'shortcuts' && (
              <SettingsShortcuts />
            )}
          </main>
        </div>

      </div>
    </div>
  );
}
