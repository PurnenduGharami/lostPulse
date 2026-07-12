import { useState } from 'react';
import type { TimeBlock, Category, CategoryActions } from '../types';
import CategoryPicker from './CategoryPicker';
import { checkLiveSessionCollision, formatTimeString } from '../utils';
import { useNotification } from '../contexts/NotificationContext';

interface TimeJournalEntryProps {
  block: TimeBlock;
  categories: Category[];
  categoryActions: CategoryActions;
  onUpdate: (updatedBlock: TimeBlock) => void;
  onDelete: (blockId: string) => void;
}

export default function TimeJournalEntry({ block, categories, categoryActions, onUpdate, onDelete }: TimeJournalEntryProps) {
  const { confirm } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  
  const [editTitle, setEditTitle] = useState(block.title);
  const [editCategoryId, setEditCategoryId] = useState(block.categoryId || block.category || '');
  const [editDescription, setEditDescription] = useState(block.description || '');
  const [isFavorite, setIsFavorite] = useState(block.isFavorite || false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const startD = new Date(block.startTime);
  const endD = new Date(block.endTime);
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const [editStartTimeStr, setEditStartTimeStr] = useState(`${pad(startD.getHours())}:${pad(startD.getMinutes())}`);
  const [editEndTimeStr, setEditEndTimeStr] = useState(`${pad(endD.getHours())}:${pad(endD.getMinutes())}`);
  const [editDateStr, setEditDateStr] = useState(block.date);

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatDuration = (startMs: number, endMs: number) => {
    const diffMins = Math.floor((endMs - startMs) / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const handleSave = () => {
    const [y, m, d] = editDateStr.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d, 0, 0, 0).getTime();

    const [startH, startM] = editStartTimeStr.split(':').map(Number);
    const [endH, endM] = editEndTimeStr.split(':').map(Number);

    const startTime = baseDate + (startH * 3600000) + (startM * 60000);
    const endTime = baseDate + (endH * 3600000) + (endM * 60000);

    // Check Live Session Collision
    const liveStart = checkLiveSessionCollision(startTime, endTime);
    if (liveStart) {
      setErrorMsg(`LIVE COLLISION: Conflicts with the Live Session running since ${formatTimeString(liveStart)}.`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    onUpdate({
      ...block,
      title: editTitle,
      categoryId: editCategoryId,
      description: editDescription,
      isFavorite,
      date: editDateStr,
      startTime,
      endTime,
      updatedAt: Date.now()
    });
    setIsEditing(false);
  };

  const handleCancel = async () => {
    let hasChanges = false;
    if (editTitle !== block.title) hasChanges = true;
    if (editDescription !== (block.description || '')) hasChanges = true;
    if (editCategoryId !== (block.categoryId || block.category || '')) hasChanges = true;
    if (isFavorite !== (block.isFavorite || false)) hasChanges = true;
    if (editDateStr !== block.date) hasChanges = true;

    if (hasChanges) {
      if (!(await confirm("You have unsaved changes. Discard them?"))) return;
    }
    
    // Reset state to block defaults
    setEditTitle(block.title);
    setEditCategoryId(block.categoryId || block.category || '');
    setEditDescription(block.description || '');
    setIsFavorite(block.isFavorite || false);
    setEditDateStr(block.date);
    setEditStartTimeStr(`${pad(startD.getHours())}:${pad(startD.getMinutes())}`);
    setEditEndTimeStr(`${pad(endD.getHours())}:${pad(endD.getMinutes())}`);

    setIsEditing(false);
  };

  const createdDateStr = block.createdAt ? new Date(block.createdAt).toLocaleDateString() : 'Unknown';
  const updatedDateStr = block.updatedAt ? new Date(block.updatedAt).toLocaleDateString() : 'Never';

  if (isEditing) {
    return (
      <div className="liquid-panel p-4 rounded-md mb-4 space-y-4 shadow-lg transition-all relative">
        {errorMsg && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[9999] liquid-panel border border-red-500 text-red-500 px-6 py-2 rounded-md font-mono text-[10px] shadow-2xl shadow-red-900/20 animate-pulse flex items-center gap-2 font-bold whitespace-nowrap">
            <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            {errorMsg}
          </div>
        )}
        <div className="flex justify-between items-center border-b border-[#333333] pb-2">
          <h3 className="text-white font-mono uppercase tracking-widest text-sm">Edit Entry</h3>
          <div className="flex space-x-2">
            <button onClick={() => setIsFavorite(!isFavorite)} className={`text-xl focus:ring-2 focus:ring-white outline-none rounded-sm ${isFavorite ? 'text-yellow-500' : 'text-[#555555]'}`}>
              ★
            </button>
            <button onClick={handleCancel} className="text-white hover:text-red-500 font-mono text-xs uppercase tracking-widest transition-colors focus:ring-2 focus:ring-white outline-none rounded-sm px-1">Cancel</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-white font-mono uppercase tracking-widest mb-1">Title</label>
            <input 
              type="text" 
              value={editTitle} 
              onChange={e => setEditTitle(e.target.value)}
              className="w-full liquid-input text-white text-sm px-3 py-2 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white font-mono uppercase tracking-widest mb-1">Category</label>
            <CategoryPicker
              categories={categories}
              categoryActions={categoryActions}
              value={editCategoryId}
              onChange={setEditCategoryId}
              mode="dropdown"
            />
          </div>
          <div>
            <label className="block text-[10px] text-white font-mono uppercase tracking-widest mb-1">Date</label>
            <input 
              type="date" 
              value={editDateStr} 
              onChange={e => setEditDateStr(e.target.value)}
              className="w-full liquid-input text-white text-sm px-3 py-2 outline-none"
            />
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-[10px] text-white font-mono uppercase tracking-widest mb-1">Start</label>
              <input 
                type="time" 
                value={editStartTimeStr} 
                onChange={e => setEditStartTimeStr(e.target.value)}
                className="w-full liquid-input text-white text-sm px-3 py-2 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-white font-mono uppercase tracking-widest mb-1">End</label>
              <input 
                type="time" 
                value={editEndTimeStr} 
                onChange={e => setEditEndTimeStr(e.target.value)}
                className="w-full liquid-input text-white text-sm px-3 py-2 outline-none"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] text-white font-mono uppercase tracking-widest mb-1">Notes</label>
          <textarea 
            value={editDescription} 
            onChange={e => setEditDescription(e.target.value)}
            rows={3}
            className="w-full liquid-input text-white text-sm px-3 py-2 outline-none resize-none"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <button 
            onClick={async () => { if (await confirm('Delete this entry?')) onDelete(block.id); }}
            className="text-red-500 hover:text-red-400 font-mono text-xs uppercase tracking-widest transition-colors liquid-button px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
          >
            Delete
          </button>
          <button 
            onClick={handleSave}
            className="liquid-button px-6 py-2 font-mono text-xs uppercase tracking-widest text-white hover:text-red-400 focus:ring-2 focus:ring-white outline-none"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  const blockCat = categories.find(c => c.id === block.categoryId || c.id === block.category) || categories.find(c => c.isUncategorized);
  const color = blockCat ? blockCat.color : '#ff0000';

  return (
    <div 
      tabIndex={0}
      className="group liquid-panel p-4 mb-3 cursor-pointer relative overflow-hidden focus:ring-2 focus:ring-white outline-none"
      style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}
      onClick={() => setIsEditing(true)}
      onKeyDown={async (e) => {
        if (e.key === 'Enter') setIsEditing(true);
        if (e.key === 'Delete' || e.key === 'Backspace') {
           if (await confirm('Delete this entry?')) onDelete(block.id);
        }
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 transition-colors" style={{ backgroundColor: color }}></div>
      
      <div className="flex justify-between items-start pl-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-1">
            <h4 className="text-white font-serif font-bold text-lg">{block.title}</h4>
            {blockCat && !blockCat.isUncategorized && (
              <span className="liquid-panel text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider rounded-sm shadow-none" style={{ color: blockCat.color }}>
                {blockCat.name}
              </span>
            )}
            {block.isFavorite && (
              <span className="text-yellow-500 text-sm">★</span>
            )}
          </div>
          
          <div className="flex items-center text-[#aaaaaa] font-mono text-xs space-x-3 mb-2">
            <span>{block.date}</span>
            <span>&bull;</span>
            <span className="text-red-500 font-bold">{formatDuration(block.startTime, block.endTime)}</span>
            <span>&bull;</span>
            <span>{formatTime(block.startTime)} &rarr; {formatTime(block.endTime)}</span>
          </div>

          {block.description && (
            <p className="text-white font-sans text-sm line-clamp-2 opacity-80 mt-2">
              {block.description}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[#555555] font-mono text-[10px] uppercase tracking-widest">Created: {createdDateStr}</span>
          {block.updatedAt && <span className="text-[#555555] font-mono text-[10px] uppercase tracking-widest mt-1">Edited: {updatedDateStr}</span>}
          <div className="mt-4">
             <button className="text-white liquid-button px-3 py-1 font-mono text-[10px] uppercase tracking-widest rounded-sm">
               Edit
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
