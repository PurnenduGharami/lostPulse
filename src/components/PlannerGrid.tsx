import React, { useState, useRef } from 'react';
import type { TimeBlock, BlockActions, Category, CategoryActions, NoteActions } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getBlocksForDay, calculateBlockLayout } from '../utils';
import CategoryPicker from './CategoryPicker';
import DailyNoteOverlay from './DailyNoteOverlay';
import { useNotification } from '../contexts/NotificationContext';

interface PlannerGridProps {

  timeBlocks: Record<string, TimeBlock[]>;
  blockActions: BlockActions;
  currentDate: string;
  categories: Category[];
  categoryActions: CategoryActions;
  scrollMap: Record<string, number>;
  setScrollMap: (map: Record<string, number>) => void;
  dailyNotes: Record<string, string[]>;
  noteActions: NoteActions;
  onStartFocus?: (task: TimeBlock) => void;
  trackerBlockActions?: BlockActions;
}

export default function PlannerGrid({ timeBlocks, blockActions, currentDate, categories, scrollMap, setScrollMap, categoryActions, dailyNotes, noteActions, onStartFocus, trackerBlockActions }: PlannerGridProps) {
  const { confirm } = useNotification();
  const getTodayStr = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const isToday = () => currentDate === getTodayStr();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  const [y, m, d] = currentDate.split('-').map(Number);
  const baseDateMs = new Date(y, m - 1, d, 0, 0, 0).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPastDay = baseDateMs < today.getTime();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPx, setDragStartPx] = useState(0);
  const [dragCurrentPx, setDragCurrentPx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  type ModalMode = 'hidden' | 'edit' | 'create';
  const [modalMode, setModalMode] = useState<ModalMode>('hidden');
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartTimeStr, setEditStartTimeStr] = useState('');
  const [editEndTimeStr, setEditEndTimeStr] = useState('');

  // Block drag-move state
  const [movingBlock, setMovingBlock] = useState<TimeBlock | null>(null);
  const [moveStartY, setMoveStartY] = useState(0);
  const [moveCurrentY, setMoveCurrentY] = useState(0);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Note Overlay State
  const [isNoteOverlayOpen, setIsNoteOverlayOpen] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);

  // Task List Tab State
  const [activeTaskListTab, setActiveTaskListTab] = useState<'unscheduled' | 'scheduled'>('unscheduled');
  const [completionPrompt, setCompletionPrompt] = useState<{ block: TimeBlock } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; block: TimeBlock | null }>({
    visible: false, x: 0, y: 0, block: null
  });

  React.useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    const timer = setInterval(updateTime, 60000);

    // Force update when tab becomes active to bypass browser background throttling
    window.addEventListener('focus', updateTime);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') updateTime();
    });

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', updateTime);
      document.removeEventListener('visibilitychange', updateTime);
    };
  }, []);

  React.useEffect(() => {
    const handleDirectEdit = (e: CustomEvent<{ block: TimeBlock }>) => {
      openEditModalForBlock(e.detail.block);
    };
    window.addEventListener('open-edit-planner-block-direct', handleDirectEdit as EventListener);
    return () => window.removeEventListener('open-edit-planner-block-direct', handleDirectEdit as EventListener);
  }, []);

  React.useEffect(() => {
    const isInView = () => {
      if (!containerRef.current) return false;
      const rect = containerRef.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      return center >= 0 && center <= window.innerHeight;
    };

    const handleN = () => {
      if (!isInView()) return;
      if (isPastDay) return;
      setModalMode('create');
    };

    const handleGlobalDelete = () => {
      if (!isInView()) return;
      if (modalMode === 'edit' && selectedBlock) {
        handleDelete();
      }
    };

    const handleEsc = () => {
      if (!isInView()) return;
      setModalMode('hidden');
      setContextMenu({ ...contextMenu, visible: false });
    };

    window.addEventListener('global-shortcut-n', handleN);
    window.addEventListener('global-shortcut-delete', handleGlobalDelete);
    window.addEventListener('close-modals', handleEsc);
    
    return () => {
      window.removeEventListener('global-shortcut-n', handleN);
      window.removeEventListener('global-shortcut-delete', handleGlobalDelete);
      window.removeEventListener('close-modals', handleEsc);
    };
  }, [modalMode, selectedBlock, contextMenu, isPastDay]);

  // Restore scroll or scroll to current time on mount/date change
  React.useEffect(() => {
    if (!scrollWrapperRef.current) return;
    
    if (scrollMap[currentDate] !== undefined) {
      scrollWrapperRef.current.scrollTop = scrollMap[currentDate];
    } else if (isToday()) {
      const now = new Date();
      const currentPx = (now.getHours() + now.getMinutes() / 60) * pixelsPerHour;
      scrollWrapperRef.current.scrollTop = Math.max(0, currentPx - scrollWrapperRef.current.clientHeight / 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]); // intentionally excluding scrollMap to avoid re-triggering

  const handleScroll = () => {
    if (scrollWrapperRef.current) {
      setScrollMap({ ...scrollMap, [currentDate]: scrollWrapperRef.current.scrollTop });
    }
  };

  // 1 hour = 60px
  const pixelsPerHour = 60;
  const totalPixels = 24 * pixelsPerHour;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPastDay) return;
    if (!containerRef.current || e.button !== 0) return; // Only left click
    if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setIsDragging(true);
    setDragStartPx(y);
    setDragCurrentPx(y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;

    if (movingBlock) {
      setMoveCurrentY(Math.max(0, Math.min(y, totalPixels)));
      return;
    }

    if (!isDragging) return;
    setDragCurrentPx(Math.max(0, Math.min(y, totalPixels)));
  };

  const handleMouseUp = () => {
    // Handle block drag-move
    if (movingBlock) {
      const deltaPxSnapped = Math.round((moveCurrentY - moveStartY) / 15) * 15;
      if (deltaPxSnapped !== 0) {
        const deltaMs = (deltaPxSnapped / pixelsPerHour) * 3600000;
        const newStartTime = movingBlock.startTime + deltaMs;
        const newEndTime = movingBlock.endTime + deltaMs;
        const dayStart = baseDateMs;
        const dayEnd = baseDateMs + 24 * 3600000;
        if (newStartTime >= dayStart && newEndTime <= dayEnd) {
          blockActions.updateBlock(movingBlock.date, {
            ...movingBlock,
            startTime: newStartTime,
            endTime: newEndTime,
            updatedAt: Date.now()
          });
        }
      }
      setMovingBlock(null);
      return;
    }

    if (!isDragging) return;
    setIsDragging(false);

    const startPx = Math.min(dragStartPx, dragCurrentPx);
    const endPx = Math.max(dragStartPx, dragCurrentPx);

    // Minimum 15 minutes block (15px)
    if (endPx - startPx < 15) return;

    // Snap to 15-minute intervals (15px)
    const startSnaped = Math.floor(startPx / 15) * 15;
    const endSnaped = Math.ceil(endPx / 15) * 15;

    const startHour = startSnaped / pixelsPerHour;
    const endHour = endSnaped / pixelsPerHour;

    const [y, m, d] = currentDate.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d, 0, 0, 0);

    const startTime = baseDate.getTime() + startHour * 3600000;
    const endTime = baseDate.getTime() + endHour * 3600000;

    const isBypassEnabled = localStorage.getItem('dev_time_bypass') === 'true';
    if (!isBypassEnabled && startTime < Date.now() - 60000) {
      setErrorMsg("Cannot plan tasks in the past.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const newBlock: TimeBlock = {
      id: uuidv4(),
      title: 'Planned Activity',
      date: currentDate,
      startTime,
      endTime,
      status: 'Pending',
      createdAt: Date.now()
    };

    blockActions.saveBlock(currentDate, newBlock);
  };

  const handleBlockMouseDown = (e: React.MouseEvent, block: TimeBlock) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (isPastDay) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    setMovingBlock(block);
    setMoveStartY(mouseY);
    setMoveCurrentY(mouseY);
  };

  const handleMouseLeave = () => {
    if (movingBlock) {
      setMovingBlock(null);
      return;
    }
    handleMouseUp();
  };

  const openEditModalForBlock = (block: TimeBlock) => {
    setSelectedBlock(block);
    setEditTitle(block.title);
    setEditCategoryId(block.categoryId || block.category || '');
    setEditDesc(block.description || '');

    const startD = new Date(block.startTime);
    const endD = new Date(block.endTime);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setEditStartTimeStr(`${pad(startD.getHours())}:${pad(startD.getMinutes())}`);
    setEditEndTimeStr(`${pad(endD.getHours())}:${pad(endD.getMinutes())}`);

    setModalMode('edit');
  };

  const handleBlockDoubleClick = (e: React.MouseEvent, block: TimeBlock) => {
    e.stopPropagation();
    if (isPastDay) return;
    openEditModalForBlock(block);
  };

  const handleBlockKeyDown = async (e: React.KeyboardEvent, block: TimeBlock) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      openEditModalForBlock(block);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (await confirm("Delete this time block?")) {
        blockActions.deleteBlock(block.date, block.id);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, block: TimeBlock) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPastDay) return;
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, block });
  };

  const handleOpenCreateModal = () => {
    setSelectedBlock(null);
    setEditTitle('');
    
    const fallback = categories.find(c => c.isUncategorized);
    setEditCategoryId(fallback ? fallback.id : '');
    
    setEditDesc('');
    setEditStartTimeStr('09:00');
    setEditEndTimeStr('10:00');
    setModalMode('create');
  };

  const handleCopyYesterday = async () => {
    const yesterday = new Date(baseDateMs - 86400000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

    const prevBlocks = timeBlocks[yesterdayStr] || [];
    if (prevBlocks.length === 0) {
      setErrorMsg("No entries found for yesterday in Time Tracker.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (await confirm("Copy all blocks from yesterday's Time Tracker to today's Planner?")) {
      const newBlocks: TimeBlock[] = prevBlocks.map(b => {
        // Shift times by 24h
        const shift = 86400000;
        return {
          ...b,
          id: uuidv4(),
          date: currentDate,
          startTime: b.startTime + shift,
          endTime: b.endTime + shift,
          status: 'Pending',
          accumulatedTimeMs: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      });
      
      if (blockActions.batchSaveBlocks) {
        blockActions.batchSaveBlocks(currentDate, newBlocks);
      } else {
        newBlocks.forEach(b => blockActions.saveBlock(currentDate, b));
      }
    }
  };

  const handleSaveModal = () => {

    const [startH, startM] = editStartTimeStr.split(':').map(Number);
    const [endH, endM] = editEndTimeStr.split(':').map(Number);

    const startTime = baseDateMs + (startH * 3600000) + (startM * 60000);
    const endTime = baseDateMs + (endH * 3600000) + (endM * 60000);

    if (endTime <= startTime) {
      setErrorMsg("End time must be after start time.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const isBypassEnabled = localStorage.getItem('dev_time_bypass') === 'true';
    if (!isBypassEnabled && modalMode === 'create' && startTime < Date.now() - 60000) {
      setErrorMsg("Cannot plan tasks in the past.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    // Removed focus session collision check for planner

    if (modalMode === 'edit' && selectedBlock) {
      blockActions.updateBlock(selectedBlock.date, {
        ...selectedBlock,
        title: editTitle,
        categoryId: editCategoryId,
        description: editDesc,
        startTime,
        endTime,
        accumulatedTimeMs: endTime - startTime,
        updatedAt: Date.now()
      });
    } else if (modalMode === 'create') {
      blockActions.saveBlock(currentDate, {
        id: uuidv4(),
        title: editTitle || 'Manual Entry',
        categoryId: editCategoryId,
        description: editDesc,
        date: currentDate,
        startTime,
        endTime,
        accumulatedTimeMs: endTime - startTime,
        status: 'Pending',
        createdAt: Date.now()
      });
    }
    setModalMode('hidden');
  };

  const handleCloseModal = async () => {
    // Unsaved changes check
    let hasChanges = false;
    if (modalMode === 'create') {
      if (editTitle || editDesc) hasChanges = true;
    } else if (modalMode === 'edit' && selectedBlock) {
      if (editTitle !== selectedBlock.title) hasChanges = true;
      if (editDesc !== (selectedBlock.description || '')) hasChanges = true;
      if (editCategoryId !== (selectedBlock.categoryId || selectedBlock.category)) hasChanges = true;
      // Time changes are slightly more complex to check, omitting for brevity of this simple check
    }

    if (hasChanges) {
      if (!(await confirm('You have unsaved changes. Discard them?'))) return;
    }
    setModalMode('hidden');
  };

  const handleDelete = async () => {
    if (modalMode === 'edit' && selectedBlock) {
      if (await confirm("Delete this time block?")) {
        blockActions.deleteBlock(selectedBlock.date, selectedBlock.id);
        setModalMode('hidden');
      }
    }
  };

  const baseDate = baseDateMs;
  const blocksForDay = getBlocksForDay(timeBlocks, currentDate);

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatDuration = (startMs: number, endMs: number) => {
    const diffMins = Math.floor((endMs - startMs) / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Generate hours for timeline
  const hours = Array.from({ length: 25 }, (_, i) => i);

  // --- Statistics Calculation ---
  let plannedMs = 0;
  let longestMs = 0;
  let shortestMs = Infinity;
  let entriesCount = 0;

  const startOfDayMs = baseDate;
  const endOfDayMs = baseDate + 24 * 3600 * 1000;

  blocksForDay.forEach(b => {
    if (b.startTime === b.endTime) return; // Skip unscheduled tasks
    const actualStart = Math.max(startOfDayMs, b.startTime);
    const actualEnd = Math.min(endOfDayMs, b.endTime);
    const duration = actualEnd - actualStart;
    
    if (duration > 0) {
      plannedMs += duration;
      entriesCount++;
      if (duration > longestMs) longestMs = duration;
      if (duration < shortestMs) shortestMs = duration;
    }
  });

  const unplannedMs = (24 * 3600 * 1000) - plannedMs;
  const averageMs = entriesCount > 0 ? plannedMs / entriesCount : 0;
  if (shortestMs === Infinity) shortestMs = 0;
  
  const formatStatsDuration = (ms: number) => {
    if (ms === 0) return '-';
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="relative w-full h-full flex flex-col lg:flex-row gap-4 sm:gap-6 overflow-y-auto lg:overflow-hidden custom-scrollbar pb-20 lg:pb-0">
      <div className="relative z-10 h-full flex-1 flex flex-col min-w-0 min-h-[500px] lg:min-h-0">
        <div className="flex justify-end items-center mb-6 gap-3">
          <button
            onClick={handleCopyYesterday}
            className="text-xs font-mono px-3 py-2 liquid-button text-[#888] hover:text-white transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy Yesterday
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="text-xs font-mono px-3 py-2 liquid-button text-white transition-colors"
          >
            + Add Entry
          </button>
        </div>

        {errorMsg && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[9999] liquid-panel border border-red-500 text-red-500 px-6 py-3 rounded-md font-mono text-xs shadow-2xl shadow-red-900/20 animate-pulse mt-4 flex items-center gap-3 font-bold whitespace-nowrap">
            <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            {errorMsg}
          </div>
        )}

        <div 
          className="relative w-full flex-1 overflow-y-auto pr-2" 
          ref={scrollWrapperRef}
          onScroll={handleScroll}
        >
          <div className="flex relative" style={{ height: `${totalPixels}px` }}>
            {/* Timeline Numbers & Gutter */}
            <div className="w-24 border-r-2 border-[#333333] flex flex-col z-10">
              {hours.map((h) => (
                <div key={h} className="h-[60px] relative">
                  <span className="absolute -top-3 right-4 text-xs font-mono text-white tracking-widest">
                    {h.toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid Area */}
            <div
              className={`flex-1 relative ${movingBlock ? 'cursor-grabbing' : 'cursor-crosshair'}`}
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {/* Grid Lines */}
              <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col pointer-events-none opacity-40">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={`line-${i}`} className="h-[60px] border-b border-[#222222]" />
                ))}
              </div>

              {/* Current Time Line */}
              {isToday() && (
                <div
                  className="absolute left-0 right-0 pointer-events-none z-50"
                  style={{
                    top: `${(currentTime.getHours() + currentTime.getMinutes() / 60) * pixelsPerHour}px`
                  }}
                >
                  <div className="w-full border-t-2 border-red-500/80 relative">
                  </div>
                </div>
              )}

              {(() => {
                const layout = calculateBlockLayout(blocksForDay);
                return blocksForDay.filter(b => b.startTime !== b.endTime).map((block) => {
                  const startOffset = Math.max(0, block.startTime - baseDate);
                  const endOffset = Math.min(24 * 3600000, block.endTime - baseDate);

                  const topPx = (startOffset / 3600000) * pixelsPerHour;
                  const heightPx = ((endOffset - startOffset) / 3600000) * pixelsPerHour;

                  const blockCat = categories.find(c => c.id === block.categoryId || c.id === block.category) || categories.find(c => c.isUncategorized);
                  const color = blockCat ? blockCat.color : '#ff0000';

                  const durationMs = endOffset - startOffset;
                  const isShort = durationMs < 3600000;
                  
                  const blockLayout = layout.get(block.id) || { width: 100, left: 0 };
                  const isBeingMoved = movingBlock?.id === block.id;
                  const moveDeltaPx = isBeingMoved ? Math.round((moveCurrentY - moveStartY) / 15) * 15 : 0;

                return (
                  <div
                    key={block.id}
                    tabIndex={0}
                    className={`absolute border-t-2 border-b-2 bg-transparent cursor-grab active:cursor-grabbing flex flex-col group overflow-hidden before:absolute before:-inset-y-2 before:-inset-x-0 before:z-[-1] focus:ring-2 focus:ring-white outline-none ${isBeingMoved ? 'z-[100] opacity-80 shadow-2xl shadow-black/50 scale-[1.02] ring-2 ring-white/20' : 'hover:bg-white/5 transition-all duration-200 hover:scale-[1.01] hover:z-40 z-30'}`}
                    style={{ 
                      top: `${topPx + moveDeltaPx}px`, 
                      height: `${heightPx}px`, 
                      minHeight: '15px', 
                      borderColor: `${color}cc`,
                      left: `${blockLayout.left}%`,
                      width: `calc(${blockLayout.width}% - 16px)`,
                      transition: isBeingMoved ? 'none' : undefined
                    }}
                    onMouseDown={(e) => handleBlockMouseDown(e, block)}
                    onDoubleClick={(e) => handleBlockDoubleClick(e, block)}
                    onKeyDown={(e) => handleBlockKeyDown(e, block)}
                    onContextMenu={(e) => handleContextMenu(e, block)}
                  >
                    {/* Progress Bar Background */}
                    {block.accumulatedTimeMs !== undefined && block.accumulatedTimeMs > 0 && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-white/20 z-0 pointer-events-none transition-all duration-500" 
                        style={{ height: `${Math.min(100, (block.accumulatedTimeMs / Math.max(1, durationMs)) * 100)}%` }}
                      />
                    )}

                    {isShort ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full border-t-2 border-dashed opacity-50" style={{ borderColor: color }} />
                      </div>
                    ) : (
                      <>
                        {/* Event Header */}
                    <div className="bg-black/50 p-1.5 px-3 flex flex-col justify-center flex-shrink-0 min-h-[30px]" style={{ borderBottom: `1px solid ${color}55` }}>
                      <div className="font-serif text-white font-bold truncate tracking-wide text-sm flex items-center space-x-2">
                        {/* Optional identity dot */}
                        <div className="w-1.5 h-1.5 rounded-full opacity-80" style={{ backgroundColor: color }}></div>
                        <span>{block.title}</span>
                      </div>
                      {heightPx >= 20 && (
                        <div className="font-mono text-white text-[10px] truncate mt-0.5">
                          {formatDuration(block.startTime, block.endTime)} &bull; {formatTime(block.startTime)} &rarr; {formatTime(block.endTime)}
                        </div>
                      )}
                    </div>

                    {/* Event Body */}
                    <div className="flex-1 p-2 px-3 relative bg-black/30 backdrop-blur-md overflow-hidden flex flex-col z-10">
                      {block.description && heightPx >= 60 ? (
                        <div className="font-mono text-white text-xs whitespace-pre-wrap break-words leading-relaxed mb-6 overflow-y-auto flex-1">
                          {block.description}
                        </div>
                      ) : (
                        heightPx >= 100 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 overflow-hidden">
                            <span 
                              className="font-serif font-black text-white opacity-[0.03] select-none text-center leading-none"
                              style={{ fontSize: `${Math.min(heightPx / 3, 100)}px` }}
                            >
                              {block.title.toUpperCase()}
                            </span>
                          </div>
                        )
                      )}

                      {/* Inline Hover Actions */}
                      <div className="absolute bottom-2 right-2 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                        {block.status !== 'Completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (block.status === 'Completed') {
                                blockActions.updateBlock(block.date, { ...block, status: 'Pending', accumulatedTimeMs: 0 });
                                return;
                              }
                              if (block.endTime < Date.now()) {
                                setCompletionPrompt({ block });
                              } else {
                                blockActions.updateBlock(block.date, { ...block, status: 'Completed', accumulatedTimeMs: durationMs });
                              }
                            }}
                            className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 uppercase tracking-widest bg-[#111111] px-2 py-1 rounded-sm focus:ring-2 focus:ring-emerald-400 outline-none flex items-center gap-1"
                            title="Mark as Completed"
                          >
                            ✓
                          </button>
                        )}
                        {onStartFocus && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartFocus(block);
                            }}
                            className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 uppercase tracking-widest bg-[#111111] px-2 py-1 rounded-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModalForBlock(block);
                          }}
                          className="text-[10px] font-mono text-white hover:text-white uppercase tracking-widest bg-[#111111] px-2 py-1 rounded-sm focus:ring-2 focus:ring-white outline-none"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (await confirm("Delete this time block?")) {
                              blockActions.deleteBlock(block.date, block.id);
                            }
                          }}
                          className="text-[10px] font-mono text-red-500 hover:text-red-500 uppercase tracking-widest bg-[#111111] px-2 py-1 rounded-sm focus:ring-2 focus:ring-red-500 outline-none"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    </>
                    )}
                  </div>
                );
              })})()}

              {/* Empty State Guidance */}
              {blocksForDay.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center justify-center max-w-xs text-center p-8 bg-[#111111]/80 backdrop-blur-md border border-[#333333] rounded-md shadow-2xl">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1" className="mb-4">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <h3 className="font-serif text-white text-lg mb-2">Plan Your Day</h3>
                    <p className="font-mono text-[#888] text-xs leading-relaxed">
                      Click and drag on the timeline or use '+ Add Task' to plan out your day.
                    </p>
                  </div>
                </div>
              )}

              {/* Dragging Preview */}
              {/* Modals */}
              {modalMode !== 'hidden' && (
                <div
                  className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
                  onMouseDown={(e) => e.stopPropagation()} // stop clicks from leaking to grid
                >
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={handleCloseModal}></div>
                  <div className="relative w-full sm:max-w-md liquid-panel p-6 sm:p-8 rounded-t-xl sm:rounded-md max-h-[90vh] overflow-y-auto">
                    <h2 className="font-mono text-xl text-white font-bold tracking-widest mb-6">
                      {modalMode === 'edit' ? 'Edit Session' : 'Add Manual Entry'}
                    </h2>

                    <div className="space-y-4 mb-6">
                      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex-1">
                          <label className="block text-xs text-white font-mono mb-1">Start Time</label>
                          <input
                            type="time"
                            value={editStartTimeStr}
                            onChange={(e) => setEditStartTimeStr(e.target.value)}
                            className="w-full liquid-input text-white text-sm px-2 py-2 outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-white font-mono mb-1">End Time</label>
                          <input
                            type="time"
                            value={editEndTimeStr}
                            onChange={(e) => setEditEndTimeStr(e.target.value)}
                            className="w-full liquid-input text-white text-sm px-2 py-2 outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex-[1]">
                          <label className="block text-xs text-white font-mono mb-1">Total Time (mins)</label>
                          <div className="w-full bg-transparent text-[#aaaaaa] text-left text-sm px-2 py-2">
                            {(() => {
                              const [sH, sM] = editStartTimeStr.split(':').map(Number);
                              const [eH, eM] = editEndTimeStr.split(':').map(Number);
                              const start = sH * 60 + sM;
                              const end = eH * 60 + eM;
                              return Math.max(0, end - start);
                            })()}
                          </div>
                        </div>
                        <div className="flex-[2]" />
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex-[2]">
                          <label className="block text-xs text-white font-mono mb-1">Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full liquid-input text-white text-sm px-2 py-2 outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-white font-mono mb-1">Category</label>
                          <CategoryPicker
                            categories={categories}
                            categoryActions={categoryActions}
                            value={editCategoryId}
                            onChange={setEditCategoryId}
                            mode="dropdown"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-white font-mono mb-1">Description (Optional)</label>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={3}
                          className="w-full liquid-input text-white text-sm px-2 py-2 outline-none resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-6">
                      <button
                        onClick={handleSaveModal}
                        className="flex-1 py-2 liquid-button text-white hover:text-red-400 font-mono text-xs tracking-widest uppercase"
                      >
                        Save
                      </button>
                      {modalMode === 'edit' && (
                        <button
                          onClick={handleDelete}
                          className="flex-1 py-2 liquid-button text-red-500 hover:text-red-400 border-red-900/50 hover:border-red-500 font-mono text-xs tracking-widest uppercase"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 py-2 liquid-button text-white font-mono text-xs tracking-widest uppercase focus:ring-2 focus:ring-white outline-none"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isDragging && (
                <div
                  className="absolute left-0 right-4 border-t-2 border-b-2 border-[#ffffff] bg-[#222222] pointer-events-none z-40"
                  style={{
                    top: `${Math.min(dragStartPx, dragCurrentPx)}px`,
                    height: `${Math.abs(dragCurrentPx - dragStartPx)}px`
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu.visible && contextMenu.block && (
          <>
            <div className="fixed inset-0 z-[999]" onClick={() => setContextMenu({ ...contextMenu, visible: false })} onContextMenu={(e) => e.preventDefault()} />
            <div 
              className="fixed z-[1000] liquid-panel p-2 flex flex-col min-w-[150px] shadow-2xl rounded-sm border border-[#333333]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setContextMenu({ ...contextMenu, visible: false }); 
                  openEditModalForBlock(contextMenu.block!); 
                }}
                className="text-left px-3 py-2 text-white font-mono text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  setContextMenu({ ...contextMenu, visible: false });
                  const duration = contextMenu.block!.endTime - contextMenu.block!.startTime;
                  const newBlock = {
                    ...contextMenu.block!,
                    id: uuidv4(),
                    startTime: contextMenu.block!.endTime,
                    endTime: contextMenu.block!.endTime + duration,
                    createdAt: Date.now()
                  };
                  blockActions.saveBlock(newBlock.date, newBlock);
                }}
                className="text-left px-3 py-2 text-white font-mono text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Duplicate
              </button>
              <button 
                onClick={async () => {
                  setContextMenu({ ...contextMenu, visible: false });
                  if (await confirm("Delete this time block?")) {
                    blockActions.deleteBlock(contextMenu.block!.date, contextMenu.block!.id);
                  }
                }}
                className="text-left px-3 py-2 text-red-500 font-mono text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Daily Statistics Sidebar */}
      <div className="relative z-10 w-full lg:w-80 lg:h-full flex flex-col flex-shrink-0 order-first lg:order-last">
        <div className="liquid-panel p-6 rounded-md flex flex-col h-full overflow-y-auto">
          <h2 className="font-serif text-white font-bold text-xl mb-6 tracking-wide flex-shrink-0">Blueprint Statistics</h2>
          
          <div className="space-y-6 flex-shrink-0 mb-8">
            <StatRow label="Blueprint Time" value={formatStatsDuration(plannedMs)} valueColor="text-white font-bold" />
            <StatRow label="Unplanned Time" value={formatStatsDuration(unplannedMs)} valueColor="text-[#aaaaaa]" />
            <StatRow label="Entries" value={entriesCount === 0 ? '-' : entriesCount.toString()} valueColor="text-white" />
            <StatRow label="Avg Duration" value={formatStatsDuration(averageMs)} valueColor="text-white" />
            <StatRow label="Longest Block" value={formatStatsDuration(longestMs)} valueColor="text-white" />
            <StatRow label="Shortest Block" value={formatStatsDuration(shortestMs)} valueColor="text-white" />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex space-x-6 border-b border-white/5 pb-2 mb-4 flex-shrink-0 relative">
              <button 
                onClick={() => setActiveTaskListTab('unscheduled')}
                className={`font-mono text-xs uppercase tracking-widest transition-colors ${activeTaskListTab === 'unscheduled' ? 'text-white' : 'text-[#555555] hover:text-white/80'}`}
              >
                Unscheduled
              </button>
              <button 
                onClick={() => setActiveTaskListTab('scheduled')}
                className={`font-mono text-xs uppercase tracking-widest transition-colors ${activeTaskListTab === 'scheduled' ? 'text-white' : 'text-[#555555] hover:text-white/80'}`}
              >
                Scheduled
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 min-h-0 flex flex-col">
              {(() => {
                const tasksToShow = activeTaskListTab === 'unscheduled' 
                  ? blocksForDay.filter(b => b.startTime === b.endTime)
                  : blocksForDay.filter(b => b.startTime !== b.endTime).sort((a, b) => a.startTime - b.startTime);

                if (tasksToShow.length === 0) {
                  return <div className="text-[#555555] font-mono text-xs text-center py-4 uppercase tracking-widest">No {activeTaskListTab} tasks</div>;
                }

                return (
                  <div className="space-y-2 mb-2">
                    {tasksToShow.map((task) => {
                      const cat = categories.find(c => c.id === task.categoryId) || categories.find(c => c.isUncategorized);
                    return (
                      <div key={task.id} className="w-full flex items-center justify-between text-left bg-black/40 border border-transparent hover:border-white/20 transition-all rounded-sm p-3 group relative overflow-hidden">
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <button 
                            onClick={() => {
                              if (task.status === 'Completed') {
                                blockActions.updateBlock(currentDate, { ...task, status: 'Pending', accumulatedTimeMs: 0 });
                                return;
                              }
                              
                              if (task.startTime !== task.endTime && task.endTime < Date.now()) {
                                setCompletionPrompt({ block: task });
                              } else {
                                blockActions.updateBlock(currentDate, { 
                                  ...task, 
                                  status: 'Completed',
                                  accumulatedTimeMs: task.startTime !== task.endTime ? (task.endTime - task.startTime) : (task.estimatedDurationMs || 25 * 60000)
                                });
                              }
                            }}
                            className={`w-3 h-3 shrink-0 rounded-full border ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-[#555] hover:border-white'} transition-colors`}
                            title={task.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
                          />
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#555' }}></div>
                          <div className={`text-white font-mono text-xs truncate ${task.status === 'Completed' ? 'line-through text-emerald-400 opacity-50' : ''}`}>{task.title}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.estimatedDurationMs && (
                            <span className="font-mono text-[10px] text-[#aaaaaa] shrink-0 group-hover:opacity-0 transition-opacity">
                              {Math.round(task.estimatedDurationMs / 60000)}m
                            </span>
                          )}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded">
                            {onStartFocus && (
                              <button 
                                onClick={() => onStartFocus(task)}
                                className="text-white hover:text-emerald-400 font-mono text-[10px] uppercase tracking-widest"
                              >
                                Start
                              </button>
                            )}
                            <button 
                              onClick={() => blockActions.deleteBlock(task.date, task.id)}
                              className="text-red-500 hover:text-red-400 font-mono text-[10px] uppercase tracking-widest"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <DailyNoteOverlay
        isOpen={isNoteOverlayOpen}
        notes={dailyNotes[currentDate] || []}
        activeNoteIndex={activeNoteIndex}
        onClose={() => setIsNoteOverlayOpen(false)}
        onSave={(newNotes: string[]) => noteActions.saveDailyNotes(currentDate, newNotes)}
        onNavigate={(newIdx: number | null) => setActiveNoteIndex(newIdx)}
      />

      {/* Completion Prompt Modal */}
      {completionPrompt && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setCompletionPrompt(null)}></div>
          <div className="relative w-full max-w-sm liquid-panel p-8 rounded-md border border-[#333]">
            <h2 className="font-mono text-lg text-white mb-6 text-center uppercase tracking-widest">Complete Task</h2>
            <p className="text-sm font-sans text-[#aaaaaa] mb-8 text-center">
              This task was scheduled in the past. Would you like to log it to your Time Tracker?
            </p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => {
                  const block = completionPrompt.block;
                  blockActions.updateBlock(currentDate, { 
                    ...block, 
                    status: 'Completed',
                    accumulatedTimeMs: block.endTime - block.startTime
                  });
                  setCompletionPrompt(null);
                }}
                className="w-full py-3 bg-[#222] hover:bg-[#333] text-white font-mono uppercase tracking-widest text-xs transition-colors rounded-sm"
              >
                Complete
              </button>
              <button 
                onClick={() => {
                  const block = completionPrompt.block;
                  const trackerEntryId = uuidv4();
                  blockActions.updateBlock(currentDate, { 
                    ...block, 
                    status: 'Completed',
                    accumulatedTimeMs: block.endTime - block.startTime,
                    linkedTrackerEntryId: trackerEntryId
                  });
                  if (trackerBlockActions) {
                    trackerBlockActions.saveBlock(currentDate, {
                      ...block,
                      id: trackerEntryId,
                      linkedPlannerTaskId: block.id,
                      status: 'Completed',
                      accumulatedTimeMs: block.endTime - block.startTime,
                      createdAt: Date.now()
                    });
                  }
                  setCompletionPrompt(null);
                }}
                className="w-full py-3 liquid-button text-emerald-400 hover:text-emerald-300 border-emerald-500/30 hover:border-emerald-500 font-mono uppercase tracking-widest text-xs transition-colors rounded-sm"
              >
                Complete & Log
              </button>
            </div>
            <button 
              onClick={() => setCompletionPrompt(null)}
              className="w-full mt-4 py-2 text-[#555] hover:text-white font-mono uppercase tracking-widest text-[10px] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Component
function StatRow({ label, value, valueColor }: { label: string, value: string, valueColor: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <span className="font-mono text-xs uppercase tracking-widest text-[#aaaaaa]">{label}</span>
      <span className={`font-mono text-sm tracking-widest ${valueColor}`}>{value}</span>
    </div>
  );
}
