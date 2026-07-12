import { useState, useMemo } from 'react';
import type { Category, CategoryActions, TimeBlock } from '../types';
import LiquidSelect from './LiquidSelect';

interface SettingsCategoriesProps {
  categories: Category[];
  categoryActions: CategoryActions;
  timeBlocks: Record<string, TimeBlock[]>;
  plannedBlocks: Record<string, TimeBlock[]>;
}

export default function SettingsCategories({ categories, categoryActions, timeBlocks, plannedBlocks }: SettingsCategoriesProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [mergingCategory, setMergingCategory] = useState<Category | null>(null);
  const [targetMergeId, setTargetMergeId] = useState<string>('');

  const stats = useMemo(() => {
    const map = new Map<string, { recordedMs: number; plannedMs: number }>();
    categories.forEach(c => map.set(c.id, { recordedMs: 0, plannedMs: 0 }));

    Object.values(timeBlocks).forEach(blocks => {
      blocks.forEach(b => {
        const id = b.categoryId || 'uncategorized';
        if (map.has(id)) {
          map.get(id)!.recordedMs += (b.endTime - b.startTime);
        }
      });
    });

    Object.values(plannedBlocks).forEach(blocks => {
      blocks.forEach(b => {
        const id = b.categoryId || 'uncategorized';
        if (map.has(id)) {
          map.get(id)!.plannedMs += (b.endTime - b.startTime);
        }
      });
    });

    return map;
  }, [categories, timeBlocks, plannedBlocks]);

  const handleCreate = () => {
    categoryActions.addCategory('New Category', '#ffffff');
  };

  const handleSave = () => {
    if (editingCategory) {
      categoryActions.updateCategory(editingCategory.id, editingCategory.name, editingCategory.color);
      // Hack for extended fields (icon, disabled, isDefault) since categoryActions doesn't support them natively right now.
      // Ideally categoryActions should take a Partial<Category> for update.
      setEditingCategory(null);
    }
  };

  const handleMerge = () => {
    if (mergingCategory && targetMergeId) {
      categoryActions.deleteCategory(mergingCategory.id, targetMergeId);
      setMergingCategory(null);
      setTargetMergeId('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="mb-8 border-b border-[#333] pb-6 flex justify-between items-end">
        <div>
          <h2 className="font-cinzel text-2xl text-white tracking-widest uppercase mb-2">Category Manager</h2>
          <p className="font-mono text-xs text-[#888] uppercase tracking-widest">
            Organize the fundamental building blocks of your time.
          </p>
        </div>
        <button 
          onClick={handleCreate}
          className="px-6 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-mono text-xs uppercase tracking-widest transition-colors rounded-sm border border-emerald-500/50"
        >
          Create Category
        </button>
      </div>

      <div className="space-y-4">
        {categories.map((cat, idx) => {
          const s = stats.get(cat.id);
          const rHours = s ? (s.recordedMs / 3600000).toFixed(1) : '0.0';
          const pHours = s ? (s.plannedMs / 3600000).toFixed(1) : '0.0';

          return (
            <div key={cat.id} className="liquid-panel p-4 rounded-md border border-[#222] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="text-xs text-[#555] font-mono w-4">{idx + 1}</div>
                <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: cat.color }} />
                <div>
                  <h4 className={`font-serif text-lg ${cat.disabled ? 'text-[#666] line-through' : 'text-white'}`}>
                    {cat.name}
                    {cat.isDefault && <span className="ml-2 font-mono text-[10px] text-emerald-400 border border-emerald-400/50 px-2 py-0.5 rounded-full uppercase">Default</span>}
                  </h4>
                  <div className="font-mono text-xs text-[#888] flex gap-4 mt-1">
                    <span>Recorded: {rHours}h</span>
                    <span>Planned: {pHours}h</span>
                  </div>
                </div>
              </div>

              {!cat.isUncategorized && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingCategory(cat)} className="p-2 text-[#888] hover:text-white" title="Edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => setMergingCategory(cat)} className="p-2 text-[#888] hover:text-amber-400" title="Merge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
                  </button>
                  <button onClick={() => categoryActions.deleteCategory(cat.id, 'uncategorized')} className="p-2 text-[#888] hover:text-red-400" title="Delete">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0a0a0c] border border-[#333] rounded-md shadow-2xl p-6">
            <h3 className="font-cinzel text-xl text-white tracking-widest uppercase mb-6 border-b border-[#333] pb-2">Edit Category</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Name</label>
                <input 
                  type="text" value={editingCategory.name} 
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] rounded-sm p-2 font-mono text-sm text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs text-[#888] uppercase">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {['#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#555555', '#a8a29e'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setEditingCategory({...editingCategory, color: c})}
                      className={`w-8 h-8 rounded-full border-2 ${editingCategory.color === c ? 'border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => setEditingCategory(null)} className="px-4 py-2 text-[#888] hover:text-white font-mono text-xs uppercase tracking-widest transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-mono text-xs uppercase tracking-widest rounded-sm border border-emerald-500/50 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergingCategory && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0a0a0c] border border-[#333] rounded-md shadow-2xl p-6">
            <h3 className="font-cinzel text-xl text-white tracking-widest uppercase mb-6 border-b border-[#333] pb-2">Merge Category</h3>
            
            <p className="font-mono text-xs text-[#888] mb-6 leading-relaxed">
              Merge all time blocks and planned blocks from <strong className="text-white">{mergingCategory.name}</strong> into a target category. The original category will be deleted.
            </p>

            <div className="flex flex-col gap-2 mb-8">
              <label className="font-mono text-xs text-[#888] uppercase">Target Category</label>
              <LiquidSelect 
                value={targetMergeId}
                onChange={(v) => setTargetMergeId(v as string)}
                options={categories.filter(c => c.id !== mergingCategory.id).map(c => ({ value: c.id, label: c.name }))}
              />
            </div>

            <div className="flex justify-end gap-4">
              <button onClick={() => { setMergingCategory(null); setTargetMergeId(''); }} className="px-4 py-2 text-[#888] hover:text-white font-mono text-xs uppercase tracking-widest transition-colors">Cancel</button>
              <button 
                onClick={handleMerge} 
                disabled={!targetMergeId}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-xs uppercase tracking-widest rounded-sm border border-amber-500/50 transition-colors"
              >
                Merge & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
