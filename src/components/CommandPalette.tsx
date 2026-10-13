import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setMode('root');
      setQuickTitle('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baseCommands = [
    { id: 'ws-tracker', label: '→ Open Kronos Record (Tracker)', shortcut: 'Space', action: () => { onSelectWorkspace('tracker'); onClose(); } },
    { id: 'ws-planner', label: '→ Open Kronos Blueprint (Planner)', shortcut: 'P', action: () => { onSelectWorkspace('planner'); onClose(); } },
    { id: 'ws-report', label: '→ Open Epilogue (Daily Report)', shortcut: 'R', action: () => { onSelectWorkspace('report'); onClose(); } },
    { id: 'ws-analytics', label: '→ Open Chronicle (Analytics)', shortcut: 'A', action: () => { onSelectWorkspace('analytics'); onClose(); } },
    { id: 'ws-settings', label: '→ Open Settings & Preferences', shortcut: 'S', action: () => { onSelectWorkspace('settings'); onClose(); } },
    { id: 'act-quicklog', label: '⚡ Quick Log Block (Past 1 Hour)', shortcut: 'N', action: () => { setMode('quicklog'); } },
    { id: 'act-export', label: '📥 Export Chronicle to Markdown', shortcut: 'E', action: () => { onExportMarkdown(); onClose(); } },
  ];

  const filteredCommands = baseCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const now = Date.now();
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const block: TimeBlock = {
      id: Math.random().toString(36).substring(2, 9),
      title: quickTitle.trim(),
      date: todayStr,
      startTime: now - 3600000, // 1 hour ago
      endTime: now,
      status: 'Completed',
      createdAt: now,
      categoryId: quickCat,
      category: quickCat
    };

    const success = await onQuickLogBlock(todayStr, block);
    if (success) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === 'root') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    } else if (e.key === 'Escape') {
      setMode('root');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 px-4 select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl liquid-glass border border-[#333333] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-4 border-b border-[#333333] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs text-white tracking-widest uppercase font-bold">
              {mode === 'root' ? 'KRONOS COMMAND PALETTE (CTRL+K)' : 'QUICK LOG TIME BLOCK'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-white font-mono text-xs px-2 py-0.5 border border-[#333333] rounded transition-colors"
          >
            ESC
          </button>
        </div>

        {mode === 'root' ? (
          <div className="p-2">
            <div className="px-3 py-2 flex items-center gap-2">
              <span className="font-mono text-red-500 text-sm font-bold">&gt;</span>
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                placeholder="Type a command or search..."
                className="w-full bg-transparent text-white placeholder-neutral-500 font-mono text-sm outline-none"
              />
            </div>
            
            <div className="border-t border-[#222222] py-2 max-h-80 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-4 text-center text-neutral-500 font-mono text-sm">
                  No matching commands.
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-mono text-sm transition-colors ${
                        isSelected 
                          ? 'bg-red-500/15 text-white border border-red-500/40' 
                          : 'text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="font-medium">{cmd.label}</span>
                      {isSelected ? (
                        <span className="text-xs text-red-500 font-bold tracking-widest">ENTER ↵</span>
                      ) : (
                        cmd.shortcut && <span className="text-xs text-neutral-500 font-mono">{cmd.shortcut}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleQuickSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-widest">
                Activity Title
              </label>
              <input
                autoFocus
                type="text"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="e.g. Deep Work / Architecture Review"
                className="w-full bg-[#111113] border border-[#333333] rounded-lg px-3.5 py-2.5 text-white font-mono text-sm outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase tracking-widest">
                Select Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map(c => {
                  const isSelected = quickCat === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setQuickCat(c.id)}
                      className={`px-3 py-2 rounded-lg font-mono text-xs flex items-center gap-2 border transition-all text-left ${
                        isSelected
                          ? 'border-red-500 bg-red-500/10 text-white'
                          : 'border-[#333333] bg-[#111113] text-neutral-400 hover:text-white hover:border-[#444444]'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setMode('root')}
                className="px-4 py-2 rounded-lg text-xs font-mono text-neutral-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-mono bg-red-600 text-white font-bold hover:bg-red-500 transition-colors tracking-wider uppercase"
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
