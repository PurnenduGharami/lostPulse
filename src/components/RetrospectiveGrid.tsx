import React, { useState, useRef } from 'react';
import type { TimeBlock, BlockActions, Category, CategoryActions, NoteActions } from '../types';
import { v4 as uuidv4 } from 'uuid';
import CategoryPicker from './CategoryPicker';
import DailyNoteOverlay from './DailyNoteOverlay';
import { formatTimeString, getBlocksForDay, findOverlappingBlock, checkLiveSessionCollision, calculateBlockLayout } from '../utils';
import { useNotification } from '../contexts/NotificationContext';

interface RetrospectiveGridProps {

  timeBlocks: Record<string, TimeBlock[]>;
  blockActions: BlockActions;
  currentDate: string;
  categories: Category[];
  categoryActions: CategoryActions;
  scrollMap: Record<string, number>;
  setScrollMap: (map: Record<string, number>) => void;
  dailyNotes: Record<string, string[]>;
  noteActions: NoteActions;
}

export default function RetrospectiveGrid({ timeBlocks, blockActions, currentDate, categories, categoryActions, scrollMap, setScrollMap, dailyNotes, noteActions }: RetrospectiveGridProps) {
  const { alert, confirm } = useNotification();
  const getTodayStr = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const isToday = () => currentDate === getTodayStr();

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPx, setDragStartPx] = useState(0);
  const [dragCurrentPx, setDragCurrentPx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Block drag-move state
  const [movingBlock, setMovingBlock] = useState<TimeBlock | null>(null);
  const [moveStartY, setMoveStartY] = useState(0);
  const [moveCurrentY, setMoveCurrentY] = useState(0);

  type ModalMode = 'hidden' | 'edit' | 'create';
  const [modalMode, setModalMode] = useState<ModalMode>('hidden');
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartTimeStr, setEditStartTimeStr] = useState('');
  const [editEndTimeStr, setEditEndTimeStr] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Note Overlay State
  const [isNoteOverlayOpen, setIsNoteOverlayOpen] = useState(false);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);

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
    window.addEventListener('open-edit-block-direct', handleDirectEdit as EventListener);
    return () => window.removeEventListener('open-edit-block-direct', handleDirectEdit as EventListener);
  }, []);

  React.useEffect(() => {
    const isInView = () => {
      if (!containerRef.current) return false;
      const rect = containerRef.current.getBoundingClientRect();
      // Check if grid is mostly visible (vertical center is in viewport)
      const center = rect.top + rect.height / 2;
      return center >= 0 && center <= window.innerHeight;
    };

    const handleN = () => {
      if (!isInView()) return;
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
      setIsNoteOverlayOpen(false);
    };

    window.addEventListener('global-shortcut-n', handleN);
    window.addEventListener('global-shortcut-delete', handleGlobalDelete);
    window.addEventListener('close-modals', handleEsc);
    
    return () => {
      window.removeEventListener('global-shortcut-n', handleN);
      window.removeEventListener('global-shortcut-delete', handleGlobalDelete);
      window.removeEventListener('close-modals', handleEsc);
    };
  }, [modalMode, selectedBlock, contextMenu]);

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
        const [cy, cm, cd] = currentDate.split('-').map(Number);
        const dayStart = new Date(cy, cm - 1, cd, 0, 0, 0).getTime();
        const dayEnd = dayStart + 24 * 3600000;
        if (newStartTime >= dayStart && newEndTime <= dayEnd && newEndTime <= Date.now()) {
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

    // Constraints
    if (endTime > Date.now()) {
      setErrorMsg("Cannot track time in the future.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    // Live session collision Check
    const activeSessionCollision = checkLiveSessionCollision(startTime, endTime);
    if (activeSessionCollision) {
      setErrorMsg(`Cannot manually track time during an active Live Session (started at ${formatTimeString(activeSessionCollision)}).`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const newBlock: TimeBlock = {
      id: uuidv4(),
      title: 'New Activity',
      date: currentDate,
      startTime,
      endTime,
      status: 'Completed',
      createdAt: Date.now()
    };

    blockActions.saveBlock(currentDate, newBlock);
  };

  const handleBlockMouseDown = (e: React.MouseEvent, block: TimeBlock) => {
    e.stopPropagation();
    if (e.button !== 0) return;
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
    e.stopPropagation(); // prevent dragging
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

  const handleSaveModal = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d, 0, 0, 0).getTime();

    const [startH, startM] = editStartTimeStr.split(':').map(Number);
    const [endH, endM] = editEndTimeStr.split(':').map(Number);

    const startTime = baseDate + (startH * 3600000) + (startM * 60000);
    const endTime = baseDate + (endH * 3600000) + (endM * 60000);

    if (endTime <= startTime) {
      setErrorMsg("End time must be after start time.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (endTime > Date.now()) {
      setErrorMsg("Cannot track time in the future.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const blocksForDay = getBlocksForDay(timeBlocks, currentDate);

    const conflict = findOverlappingBlock(blocksForDay, startTime, endTime, modalMode === 'edit' && selectedBlock ? selectedBlock.id : undefined);
    if (conflict) {
      setErrorMsg(`OVERLAP DETECTED: Conflicts with an entry from ${formatTimeString(conflict.startTime)} to ${formatTimeString(conflict.endTime)}.`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    // Check Live Session Collision
    const liveStart = checkLiveSessionCollision(startTime, endTime);
    if (liveStart) {
      setErrorMsg(`LIVE COLLISION: Conflicts with the Live Session running since ${formatTimeString(liveStart)}.`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    if (modalMode === 'edit' && selectedBlock) {
      blockActions.updateBlock(selectedBlock.date, {
        ...selectedBlock,
        title: editTitle,
        categoryId: editCategoryId,
        description: editDesc,
        startTime,
        endTime,
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
        status: 'Completed',
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

  const [y, m, d] = currentDate.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d, 0, 0, 0).getTime();
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
  let recordedMs = 0;
  let longestMs = 0;
  let shortestMs = Infinity;
  let entriesCount = 0;

  const startOfDayMs = baseDate;
  const endOfDayMs = baseDate + 24 * 3600 * 1000;

  blocksForDay.forEach(b => {
    const actualStart = Math.max(startOfDayMs, b.startTime);
    const actualEnd = Math.min(endOfDayMs, b.endTime);
    const duration = actualEnd - actualStart;
    
    if (duration > 0) {
      recordedMs += duration;
      entriesCount++;
      if (duration > longestMs) longestMs = duration;
      if (duration < shortestMs) shortestMs = duration;
    }
  });

  const unrecordedMs = (24 * 3600 * 1000) - recordedMs;
  const averageMs = entriesCount > 0 ? recordedMs / entriesCount : 0;
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
    <div className="relative w-full h-full flex flex-col lg:flex-row gap-4 sm:gap-6">
      <div className="relative z-10 h-full flex-1 flex flex-col min-w-0">
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={handleOpenCreateModal}
            className="text-xs font-mono px-3 py-2 liquid-button text-white transition-colors min-h-[44px]"
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
                    <div className="absolute -top-1.5 -left-[5px] w-3 h-3 bg-red-500 shadow-[0_0_15px_rgba(255,0,0,0.8)] transform rotate-45" />
                  </div>
                </div>
              )}

              {(() => {
                const layout = calculateBlockLayout(blocksForDay);
                return blocksForDay.map((block) => {
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
                    <div className="flex-1 p-2 px-3 relative bg-black/30 backdrop-blur-md overflow-hidden flex flex-col">
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
                      <div className="absolute bottom-2 right-2 flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
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
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <h3 className="font-serif text-white text-lg mb-2">A Blank Canvas</h3>
                    <p className="font-mono text-[#888] text-xs leading-relaxed">
                      Click and drag on the timeline or use '+ Add Entry' to log an activity.
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
                      <div className="flex space-x-4">
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
                      <div className="flex space-x-4">
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
          <h2 className="font-serif text-white font-bold text-xl mb-6 tracking-wide flex-shrink-0">Statistics</h2>
          
          <div className="space-y-6 flex-shrink-0 mb-8">
            <StatRow label="Recorded Time" value={formatStatsDuration(recordedMs)} valueColor="text-white font-bold" />
            <StatRow label="Unrecorded Time" value={formatStatsDuration(unrecordedMs)} valueColor="text-[#aaaaaa]" />
            <StatRow label="Entries" value={entriesCount === 0 ? '-' : entriesCount.toString()} valueColor="text-white" />
            <StatRow label="Avg Duration" value={formatStatsDuration(averageMs)} valueColor="text-white" />
            <StatRow label="Longest Session" value={formatStatsDuration(longestMs)} valueColor="text-white" />
            <StatRow label="Shortest Session" value={formatStatsDuration(shortestMs)} valueColor="text-white" />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-4 flex-shrink-0">
              <h3 className="font-mono text-[#aaaaaa] text-xs uppercase tracking-widest">Daily Notes</h3>
              <button 
                onClick={() => {
                  if ((dailyNotes[currentDate] || []).length >= 7) {
                    alert("Maximum 7 notes allowed per day.");
                    return;
                  }
                  setActiveNoteIndex(null);
                  setIsNoteOverlayOpen(true);
                }}
                className="text-xs font-mono text-white hover:text-red-500 transition-colors"
              >
                + New Note
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4 min-h-0 flex flex-col">
              <div className="space-y-2 mb-2">
                {(dailyNotes[currentDate] || []).map((note, idx) => {
                  const title = note.trim().split('\n')[0] || 'New Note';
                  return (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setActiveNoteIndex(idx);
                        setIsNoteOverlayOpen(true);
                      }}
                      className="w-full text-left bg-black/40 hover:bg-white/5 border border-transparent hover:border-[#333333] transition-colors rounded-sm p-3 group"
                    >
                      <div className="text-white font-mono text-xs truncate">
                        {title}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => {
                  if ((dailyNotes[currentDate] || []).length >= 7) {
                    alert("Maximum 7 notes allowed per day.");
                    return;
                  }
                  setActiveNoteIndex(null);
                  setIsNoteOverlayOpen(true);
                }}
                className="w-full flex-1 flex items-start text-left bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/20 transition-colors rounded-sm p-3 cursor-text mt-auto min-h-[40px]"
              >
                <div className="text-[#555555] font-mono text-xs truncate">
                  Write a note...
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <DailyNoteOverlay
        isOpen={isNoteOverlayOpen}
        notes={dailyNotes[currentDate] || []}
        activeNoteIndex={activeNoteIndex}
        onClose={() => setIsNoteOverlayOpen(false)}
        onSave={(newNotes) => noteActions.saveDailyNotes(currentDate, newNotes)}
        onNavigate={(newIdx) => setActiveNoteIndex(newIdx)}
      />
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
