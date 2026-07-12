import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { TimeBlock, BlockActions, Category, CategoryActions } from '../types';
import TimeJournalEntry from './TimeJournalEntry';
import CategoryPicker from './CategoryPicker';
import LiquidSelect from './LiquidSelect';

interface TimeJournalProps {
  timeBlocks: Record<string, TimeBlock[]>;
  blockActions: BlockActions;
  categories: Category[];
  categoryActions: CategoryActions;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  categoryFilterId: string;
  setCategoryFilterId: (id: string) => void;
  notesFilter: boolean;
  setNotesFilter: (v: boolean) => void;
  favoritesFilter: boolean;
  setFavoritesFilter: (v: boolean) => void;
  dateMode: 'all' | 'today' | 'this_week' | 'this_month';
  setDateMode: (m: 'all' | 'today' | 'this_week' | 'this_month') => void;
}

export default function TimeJournal({ 
  timeBlocks, blockActions, categories, categoryActions,
  searchQuery, setSearchQuery, categoryFilterId, setCategoryFilterId,
  notesFilter, setNotesFilter, favoritesFilter, setFavoritesFilter,
  dateMode, setDateMode
}: TimeJournalProps) {

  // Flatten and sort
  const allBlocks = useMemo(() => {
    const blocks: TimeBlock[] = [];
    Object.values(timeBlocks).forEach(dayBlocks => {
      blocks.push(...dayBlocks);
    });
    // Sort reverse chronological
    return blocks.sort((a, b) => b.startTime - a.startTime);
  }, [timeBlocks]);

  const filteredBlocks = useMemo(() => {
    return allBlocks.filter(block => {
      if (favoritesFilter && !block.isFavorite) return false;
      if (notesFilter && !block.description?.trim()) return false;
      if (categoryFilterId) {
        if (block.categoryId !== categoryFilterId && block.category !== categoryFilterId) return false;
      }
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        
        // Find category name for search
        const blockCat = categories.find(c => c.id === block.categoryId || c.id === block.category);
        const catName = blockCat ? blockCat.name : '';

        if (
          !block.title.toLowerCase().includes(q) &&
          !(block.description || '').toLowerCase().includes(q) &&
          !catName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Date filtering
      if (dateMode !== 'all') {
        const now = new Date();
        const blockDate = new Date(block.startTime);
        
        if (dateMode === 'today') {
           if (blockDate.toDateString() !== now.toDateString()) return false;
        } else if (dateMode === 'this_week') {
           if (now.getTime() - block.startTime > 7 * 24 * 3600 * 1000) return false;
        } else if (dateMode === 'this_month') {
           if (blockDate.getMonth() !== now.getMonth() || blockDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [allBlocks, searchQuery, categoryFilterId, notesFilter, favoritesFilter, dateMode, categories]);

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 pb-8">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 pt-4">
        <div className="flex-1 relative">
           <input 
             type="text" 
             placeholder="Search title, notes, category..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="w-full liquid-input text-white pl-10 pr-4 py-3 outline-none font-sans shadow-none"
           />
           <span className="absolute left-3 top-3.5 text-[#555555]">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
           </span>
        </div>

        <div className="flex flex-wrap gap-2 w-full">
           <LiquidSelect 
             value={dateMode} 
             onChange={(val) => setDateMode(val as any)}
             options={[
               { value: 'all', label: 'All Time' },
               { value: 'today', label: 'Today' },
               { value: 'this_week', label: 'This Week' },
               { value: 'this_month', label: 'This Month' }
             ]}
             className="w-full sm:w-36"
           />

           <div className="w-full sm:w-48">
             <CategoryPicker
               categories={categories}
               categoryActions={categoryActions}
               value={categoryFilterId}
               onChange={setCategoryFilterId}
               mode="dropdown"
             />
           </div>

           <button 
             onClick={() => setFavoritesFilter(!favoritesFilter)}
             className={`flex-1 sm:flex-initial px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] flex items-center justify-center ${favoritesFilter ? 'text-yellow-500 border-yellow-500/50' : 'text-[#555555] hover:text-white'}`}
           >
             ★ Favs
           </button>

           <button 
             onClick={() => setNotesFilter(!notesFilter)}
             className={`flex-1 sm:flex-initial px-4 py-2 liquid-button font-mono text-xs uppercase tracking-widest min-h-[44px] flex items-center justify-center ${notesFilter ? 'text-red-500 border-red-500/50' : 'text-[#555555] hover:text-white'}`}
           >
             Has Notes
           </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 border-b border-[#222222] pb-2">
        <span className="font-mono text-xs text-[#555555] uppercase tracking-widest">
           Showing {filteredBlocks.length} {filteredBlocks.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="flex-1 w-full relative">
        {allBlocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[#555555] font-mono uppercase tracking-widest mb-4">No entries recorded yet.</p>
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[#555555] font-mono uppercase tracking-widest mb-4">No entries match your filters.</p>
            <button onClick={() => {
              setSearchQuery('');
              setCategoryFilterId('');
              setNotesFilter(false);
              setFavoritesFilter(false);
              setDateMode('all');
            }} className="text-white hover:text-red-500 font-mono text-xs uppercase tracking-widest transition-colors underline cursor-pointer">
              Clear all filters
            </button>
          </div>
        ) : (
          <Virtuoso
            style={{ height: '100%', width: '100%' }}
            data={filteredBlocks}
            itemContent={(_, block) => (
              <TimeJournalEntry 
                key={block.id}
                block={block}
                categories={categories}
                categoryActions={categoryActions}
                onUpdate={(updatedBlock) => blockActions.updateBlock(block.date, updatedBlock)}
                onDelete={(blockId) => blockActions.deleteBlock(block.date, blockId)}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
