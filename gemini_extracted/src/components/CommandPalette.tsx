import { useState, useEffect } from 'react';
import type { WorkspaceType } from './FloatingNav';
import type { Category, TimeBlock } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkspace: (ws: WorkspaceType) => void;
  categories: Category[];
  onQuickLogBlock: (dateStr: string, block: TimeBlock) => Promise<boolean>;
  onExportMarkdown: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectWorkspace,
  categories,
  onQuickLogBlock,
  onExportMarkdown
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'root' | 'quicklog'>('root');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCat, setQuickCat] = useState(categories[0]?.id || 'uncategorized');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setMode('root');
      setQuickTitle('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const now = Date.now();
    const block: TimeBlock = {
      id: Math.random().toString(36).substring(2, 9),
      title: quickTitle.trim(),
      startTime: now - 3600000, // 1 hour ago default
      endTime: now,
      categoryId: quickCat,
      category: quickCat
    };
    const success = await onQuickLogBlock(new Date().toISOString().split('T')[0], block);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 px-4">
      <div className="w-full max-w-xl liquid-glass border border-[#333333] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[#333333] flex items-center justify-between">
          <span className="font-mono text-xs text-neutral-400 tracking-widest uppercase">
            {mode === 'root' ? 'KRONOS COMMAND PALETTE (CTRL+K)' : 'QUICK LOG TIME BLOCK'}
          </span>
          <button onClick={onClose} className="text-neutral-400 hover:text-white font-mono text-xs">ESC</button>
        </div>

        {mode === 'root' ? (
          <div className="p-2">
            <div className="px-3 py-2">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full bg-transparent text-white placeholder-neutral-500 font-mono text-sm outline-none"
              />
            </div>
            <div className="border-t border-[#222222] py-2">
              <div className="px-3 py-1 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Navigation</div>
              <button
                onClick={() => { onSelectWorkspace('tracker'); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg flex items-center justify-between font-mono"
              >
                <span>→ Open Kronos Record (Tracker)</span>
                <span className="text-xs text-neutral-500">Space</span>
              </button>
              <button
                onClick={() => { onSelectWorkspace('planner'); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg flex items-center justify-between font-mono"
              >
                <span>→ Open Kronos Blueprint (Planner)</span>
              </button>
              <button
                onClick={() => { onSelectWorkspace('report'); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg flex items-center justify-between font-mono"
              >
                <span>→ Open Epilogue (Daily Report)</span>
              </button>
              <button
                onClick={() => { onSelectWorkspace('analytics'); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg flex items-center justify-between font-mono"
              >
                <span>→ Open Chronicle (Analytics)</span>
              </button>
              <button
                onClick={() => { onSelectWorkspace('settings'); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg flex items-center justify-between font-mono"
              >
                <span>→ Open Settings & Backup</span>
              </button>

              <div className="mt-3 px-3 py-1 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Actions</div>
              <button
                onClick={() => setMode('quicklog')}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg flex items-center justify-between font-mono"
              >
                <span>⚡ Quick Log Block (Past 1 Hour)</span>
                <span className="text-xs text-neutral-500">N</span>
              </button>
              <button
                onClick={() => { onExportMarkdown(); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg flex items-center justify-between font-mono"
              >
                <span>📥 Export Markdown Report</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleQuickSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1 uppercase tracking-widest">Block Title</label>
              <input
                autoFocus
                type="text"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="e.g. Deep Work / System Architecture"
                className="w-full bg-[#111113] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1 uppercase tracking-widest">Category</label>
              <select
                value={quickCat}
                onChange={e => setQuickCat(e.target.value)}
                className="w-full bg-[#111113] border border-[#333333] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none focus:border-red-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('root')}
                className="px-4 py-2 rounded-lg text-xs font-mono text-neutral-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-mono bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
              >
                Log Past Hour
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
