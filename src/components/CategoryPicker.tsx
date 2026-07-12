import { useState, useMemo, useRef, useEffect } from 'react';
import type { Category, CategoryActions } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface CategoryPickerProps {
  categories: Category[];
  categoryActions: CategoryActions;
  value: string;
  onChange: (categoryId: string) => void;
  className?: string;
  mode?: 'dropdown' | 'buttons';
  disabled?: boolean;
}

export default function CategoryPicker({ categories, categoryActions, value, onChange, className = '', mode = 'dropdown', disabled = false }: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedCategories = useMemo(() => {
    let filtered = categories;
    if (search) {
      const s = search.toLowerCase();
      filtered = categories.filter(c => c.name.toLowerCase().includes(s));
    } else {
      // Sort by recent, then uncategorized at the very bottom
      filtered = [...categories].sort((a, b) => {
        if (a.isUncategorized) return 1;
        if (b.isUncategorized) return -1;
        return b.lastUsedAt - a.lastUsedAt;
      });
    }
    return filtered;
  }, [categories, search]);

  const handleSelect = (catId: string) => {
    if (disabled) return;
    onChange(catId);
    categoryActions.markCategoryUsed(catId);
    setIsOpen(false);
    setSearch('');
  };

  const selectedCategory = categories.find(c => c.id === value) || categories.find(c => c.isUncategorized);

  if (mode === 'buttons') {
    return (
      <div className={`flex flex-col space-y-4 w-full ${className}`}>
        <div className="flex flex-wrap justify-center gap-4">
          {sortedCategories.slice(0, 6).map(c => (
            <button
              key={c.id}
              disabled={disabled}
              onClick={() => handleSelect(c.id)}
              className={`px-5 py-2 text-xs md:text-sm liquid-button font-mono tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                borderColor: value === c.id ? c.color : 'rgba(255, 255, 255, 0.1)',
                color: value === c.id ? c.color : '#aaaaaa',
                backgroundColor: value === c.id ? 'rgba(30, 30, 35, 0.8)' : undefined,
              }}
            >
              {c.name}
            </button>
          ))}
          <button
             disabled={disabled}
             onClick={() => setIsManageModalOpen(true)}
             className="px-5 py-2 text-xs md:text-sm liquid-button font-mono tracking-widest uppercase text-[#aaaaaa] disabled:opacity-50 disabled:cursor-not-allowed hover:text-white"
          >
            Manage...
          </button>
        </div>
        {isManageModalOpen && <ManageCategoriesModal categories={categories} categoryActions={categoryActions} onClose={() => setIsManageModalOpen(false)} />}
      </div>
    );
  }

  // Dropdown mode
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full liquid-input text-left px-3 py-2 outline-none flex justify-between items-center disabled:opacity-50"
      >
        <span className="font-mono text-xs uppercase tracking-widest flex items-center space-x-2 min-w-0 flex-1 pr-2">
           <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: selectedCategory?.color }}></span>
           <span className="truncate" style={{ color: selectedCategory?.color }}>{selectedCategory?.name || 'Select Category'}</span>
        </span>
        <span className="text-[#555555] text-xs">▼</span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 liquid-panel z-[1001] flex flex-col max-h-64 rounded-md overflow-hidden">
          <input
            type="text"
            autoFocus
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-b border-[#222222] text-white font-mono text-xs p-2 outline-none"
          />
          <div className="overflow-y-auto flex-1">
            {sortedCategories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.id)}
                className="w-full text-left px-3 py-2 hover:bg-[#222222] flex items-center space-x-2 transition-colors"
              >
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }}></span>
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: c.color }}>{c.name}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { setIsOpen(false); setIsManageModalOpen(true); }}
            className="w-full text-left px-3 py-2 border-t border-white/10 text-white hover:text-red-400 font-mono text-xs tracking-widest uppercase bg-black/40"
          >
            + Manage Categories
          </button>
        </div>
      )}

      {isManageModalOpen && <ManageCategoriesModal categories={categories} categoryActions={categoryActions} onClose={() => setIsManageModalOpen(false)} />}
    </div>
  );
}

// Sub-component for managing categories
function ManageCategoriesModal({ categories, categoryActions, onClose }: { categories: Category[], categoryActions: CategoryActions, onClose: () => void }) {
  const { alert, confirm } = useNotification();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#ffffff');
  
  const shades = ['#ffffff', '#ffcccc', '#ff9999', '#ff6666', '#ff3333', '#cc0000', '#8b0000'];

  const startEdit = (c?: Category) => {
    if (c) {
      setEditingId(c.id);
      setEditName(c.name);
      setEditColor(c.color);
    } else {
      setEditingId('NEW');
      setEditName('');
      setEditColor('#ffffff');
    }
  };

  const handleSave = () => {
    if (!editName.trim()) return;
    
    // Prevent duplicates
    const isDuplicate = categories.some(c => c.name.toLowerCase() === editName.trim().toLowerCase() && c.id !== editingId);
    if (isDuplicate) {
       alert("Category name already exists.");
       return;
    }

    if (editingId === 'NEW') {
      categoryActions.addCategory(editName.trim(), editColor);
    } else if (editingId) {
      categoryActions.updateCategory(editingId, editName.trim(), editColor);
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const fallback = categories.find(c => c.isUncategorized);
    if (fallback) {
      categoryActions.deleteCategory(id, fallback.id);
    }
  };

  return (
    <div className="fixed inset-0 z-[1002] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full sm:max-w-md liquid-panel p-6 rounded-t-xl sm:rounded-md max-h-[90vh] overflow-y-auto">
        <h2 className="font-mono text-xl text-white font-bold tracking-widest mb-6">Manage Categories</h2>

        {editingId ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs text-white font-mono mb-1">Name</label>
              <input
                type="text"
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full liquid-input text-white text-sm px-2 py-2 outline-none font-mono uppercase tracking-widest min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs text-white font-mono mb-2">Color</label>
              <div className="flex space-x-2">
                {shades.map(s => (
                  <button
                    key={s}
                    onClick={() => setEditColor(s)}
                    className={`w-6 h-6 rounded-full transition-transform ${editColor === s ? 'scale-125 border-2 border-white' : ''}`}
                    style={{ backgroundColor: s }}
                  />
                ))}
              </div>
            </div>
            <div className="flex space-x-2 pt-4">
              <button onClick={handleSave} className="flex-1 py-2 liquid-button text-white hover:text-red-400 font-mono text-xs tracking-widest uppercase min-h-[44px]">Save</button>
              <button onClick={() => setEditingId(null)} className="flex-1 py-2 liquid-button text-white font-mono text-xs tracking-widest uppercase min-h-[44px]">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto pr-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 hover:bg-[#222222] group rounded-sm border border-transparent hover:border-[#333333] min-h-[44px]">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></div>
                  <span className="font-mono text-sm tracking-widest uppercase" style={{ color: c.color }}>{c.name}</span>
                </div>
                {!c.isUncategorized && (
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(c)} className="text-[10px] font-mono text-white hover:text-red-500 uppercase tracking-widest p-2">Edit</button>
                    <button onClick={async () => { if (await confirm('Delete category? Entries will be moved to Uncategorized.')) handleDelete(c.id); }} className="text-[10px] font-mono text-[#555555] hover:text-red-500 uppercase tracking-widest p-2">Del</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!editingId && (
          <div className="flex justify-between items-center border-t border-white/10 pt-4">
             <button onClick={() => startEdit()} className="text-xs font-mono px-3 py-2 liquid-button text-white transition-colors min-h-[44px]">+ New Category</button>
             <button onClick={onClose} className="text-xs font-mono text-[#aaaaaa] hover:text-white transition-colors uppercase tracking-widest min-h-[44px] px-3">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
