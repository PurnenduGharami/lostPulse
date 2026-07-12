import React, { useState, useEffect } from 'react';
import type { TimeBlock, BlockActions, Category, CategoryActions, NoteActions } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getBlocksForDay, findOverlappingBlock } from '../utils';
import CategoryPicker from './CategoryPicker';
import LiquidNumberInput from './LiquidNumberInput';

interface DailyPlannerProps {
  timeBlocks: Record<string, TimeBlock[]>;
  blockActions: BlockActions;
  categories: Category[];
  categoryActions: CategoryActions;
  dailyNotes: Record<string, string[]>;
  noteActions: NoteActions;
  currentDate: string;
  onStartFocus?: (task: TimeBlock) => void;
  trackerBlockActions?: BlockActions;
}

export default function DailyPlanner({
  timeBlocks,
  blockActions,
  categories,
  categoryActions,
  dailyNotes,
  noteActions,
  currentDate,
  onStartFocus,
  trackerBlockActions
}: DailyPlannerProps) {
  
  const notesForDay = dailyNotes[currentDate] || [];
  const goal = notesForDay[0] || '';
  const why = notesForDay[1] || '';
  const reflection = notesForDay[2] || '';

  const [localGoal, setLocalGoal] = useState(goal);
  const [localWhy, setLocalWhy] = useState(why);
  const [localReflection, setLocalReflection] = useState(reflection);

  const [isReflecting, setIsReflecting] = useState(!reflection);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEstimatedMinutes, setNewTaskEstimatedMinutes] = useState('');
  
  const [newTaskCategoryId, setNewTaskCategoryId] = useState(() => {
    const fallback = categories.find(c => c.isUncategorized);
    return fallback ? fallback.id : '';
  });

  type ModalMode = 'hidden' | 'create' | 'edit';
  const [modalMode, setModalMode] = useState<ModalMode>('hidden');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editStartTimeStr, setEditStartTimeStr] = useState('09:00');
  const [editEndTimeStr, setEditEndTimeStr] = useState('10:00');
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [conflictError, setConflictError] = useState('');
  
  const [completionPrompt, setCompletionPrompt] = useState<{ block: TimeBlock } | null>(null);

  const handleOpenCreateModal = () => {
    setEditStartTimeStr('09:00');
    setEditEndTimeStr('10:00');
    setEditTitle('');
    setEditDesc('');
    setEditCategoryId(categories.find(c => c.isUncategorized)?.id || '');
    setSelectedBlockId(null);
    setConflictError('');
    setModalMode('create');
  };

  const handleOpenScheduleModal = (task: TimeBlock) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (task.startTime !== task.endTime) {
       const sd = new Date(task.startTime);
       const ed = new Date(task.endTime);
       setEditStartTimeStr(`${pad(sd.getHours())}:${pad(sd.getMinutes())}`);
       setEditEndTimeStr(`${pad(ed.getHours())}:${pad(ed.getMinutes())}`);
    } else {
       setEditStartTimeStr('09:00');
       setEditEndTimeStr('10:00');
    }
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditCategoryId(task.categoryId || '');
    setSelectedBlockId(task.id);
    setConflictError('');
    setModalMode('edit');
  };

  const handleSaveModal = () => {
    if (!editTitle.trim()) {
      setConflictError("Title is required");
      return;
    }
    
    const [y, m, d] = currentDate.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d, 0, 0, 0).getTime();
    
    const [sh, sm] = editStartTimeStr.split(':').map(Number);
    const [eh, em] = editEndTimeStr.split(':').map(Number);
    
    let startTime = baseDate + (sh * 3600000) + (sm * 60000);
    let endTime = baseDate + (eh * 3600000) + (em * 60000);
    
    if (endTime <= startTime) {
      setConflictError("End time must be after start time");
      return;
    }

    const isBypassEnabled = localStorage.getItem('dev_time_bypass') === 'true';
    if (!isBypassEnabled && modalMode === 'create' && startTime < Date.now() - 60000) {
      setConflictError("Cannot plan tasks in the past");
      return;
    }

    if (modalMode === 'edit' && selectedBlockId) {
      blockActions.updateBlock(currentDate, {
        id: selectedBlockId,
        title: editTitle,
        date: currentDate,
        startTime,
        endTime,
        status: 'Pending',
        categoryId: editCategoryId,
        description: editDesc,
        createdAt: Date.now()
      });
    } else if (modalMode === 'create') {
      blockActions.saveBlock(currentDate, {
        id: uuidv4(),
        title: editTitle,
        date: currentDate,
        startTime,
        endTime,
        status: 'Pending',
        categoryId: editCategoryId,
        description: editDesc,
        createdAt: Date.now()
      });
    }
    setModalMode('hidden');
  };

  useEffect(() => {
    const notes = dailyNotes[currentDate] || [];
    setLocalGoal(notes[0] || '');
    setLocalWhy(notes[1] || '');
    setLocalReflection(notes[2] || '');
    setIsReflecting(!(notes[2] || ''));
  }, [currentDate]); // Only sync when date changes

  const saveNotes = (g: string, w: string, r: string) => {
    noteActions.saveDailyNotes(currentDate, [g, w, r]);
  };

  const handleFinishReflection = () => {
    if (!localReflection.trim()) return;
    saveNotes(localGoal, localWhy, localReflection);
    setIsReflecting(false);
  };

  const blocks = getBlocksForDay(timeBlocks, currentDate);
  const unscheduledTasks = blocks.filter(b => b.startTime === b.endTime);
  const scheduledTasks = blocks.filter(b => b.startTime !== b.endTime).sort((a, b) => a.startTime - b.startTime);

  let plannedMs = 0;
  const categoryTimeMap: Record<string, number> = {};
  scheduledTasks.forEach(b => {
    const duration = b.endTime - b.startTime;
    plannedMs += duration;
    if (b.categoryId) {
      categoryTimeMap[b.categoryId] = (categoryTimeMap[b.categoryId] || 0) + duration;
    } else {
      categoryTimeMap['uncategorized'] = (categoryTimeMap['uncategorized'] || 0) + duration;
    }
  });

  const handleOptimizeSchedule = () => {
    if (!blockActions.batchUpdateBlocks) return;
    
    const [y, m, d] = currentDate.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d, 0, 0, 0).getTime();
    
    // Group unscheduled tasks by category
    const groupedTasks = [...unscheduledTasks].sort((a, b) => {
      if (a.categoryId === b.categoryId) return 0;
      return (a.categoryId || '') < (b.categoryId || '') ? -1 : 1;
    });

    const now = Date.now();
    const isBypassEnabled = localStorage.getItem('dev_time_bypass') === 'true';
    let defaultStart = isBypassEnabled ? baseDate + 9 * 3600000 : Math.max(baseDate + 9 * 3600000, now);
    // Round to nearest 15 mins
    let currentSlotStart = Math.ceil(defaultStart / 900000) * 900000;
    
    const localScheduled = [...scheduledTasks]; // Track newly scheduled locally
    const updates: TimeBlock[] = [];

    groupedTasks.forEach(task => {
      let durationMs = task.estimatedDurationMs || 30 * 60000;
      
      // Max search 24 hours (avoid infinite loop)
      for (let i = 0; i < 96; i++) { 
        let slotEnd = currentSlotStart + durationMs;
        const conflict = findOverlappingBlock(localScheduled, currentSlotStart, slotEnd);
        
        if (!conflict) {
           const updatedTask = { ...task, startTime: currentSlotStart, endTime: slotEnd };
           updates.push(updatedTask);
           localScheduled.push(updatedTask);
           currentSlotStart = slotEnd; // next task starts immediately after
           break;
        } else {
           // Move currentSlotStart to the end of the conflicting block
           currentSlotStart = conflict.endTime;
        }
      }
    });

    if (updates.length > 0) {
      blockActions.batchUpdateBlocks(currentDate, updates);
    }
  };


  const handleAddUnscheduled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const [y, m, d] = currentDate.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d, 0, 0, 0).getTime();
    const estimatedMs = newTaskEstimatedMinutes ? parseInt(newTaskEstimatedMinutes, 10) * 60000 : undefined;
    
    blockActions.saveBlock(currentDate, {
      id: uuidv4(),
      title: newTaskTitle,
      date: currentDate,
      startTime: baseDate,
      endTime: baseDate, // 0 duration = unscheduled
      estimatedDurationMs: estimatedMs,
      status: 'Pending',
      categoryId: newTaskCategoryId,
      createdAt: Date.now()
    });
    
    setNewTaskTitle('');
    setNewTaskEstimatedMinutes('');
  };

  if (isReflecting) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 relative">
        <div className="max-w-2xl w-full text-center space-y-12">
          <h2 className="font-serif text-3xl md:text-5xl text-white font-bold tracking-wide mb-2 leading-tight">
            If today were your last day, <br/><span className="text-red-500">what would matter most?</span>
          </h2>
          <textarea 
            value={localReflection}
            onChange={e => setLocalReflection(e.target.value)}
            className="w-full bg-transparent border-b-2 border-white/20 focus:border-red-500 text-white font-serif text-2xl md:text-3xl text-center outline-none resize-none overflow-hidden placeholder:text-[#333333] transition-colors py-4"
            placeholder="Write your answer..."
            rows={2}
            autoFocus
          />
          <div>
            <button 
              onClick={handleFinishReflection}
              disabled={!localReflection.trim()}
              className="px-10 py-4 liquid-button text-white font-mono uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Begin Planning
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 pb-8 overflow-y-auto">
      


      {/* Header Goals */}
      <div className="w-full liquid-panel p-8 rounded-md mb-8 mt-4 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-2">
          <label className="font-mono text-[10px] text-red-500 uppercase tracking-widest">Today's Goal</label>
          <input 
            type="text"
            value={localGoal}
            onChange={e => {
              setLocalGoal(e.target.value);
              saveNotes(e.target.value, localWhy, localReflection);
            }}
            placeholder="What is the one thing you must accomplish?"
            className="w-full bg-transparent border-b border-white/20 focus:border-white text-white font-serif text-2xl outline-none py-2 transition-colors"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label className="font-mono text-[10px] text-[#aaaaaa] uppercase tracking-widest">Why it matters</label>
          <input 
            type="text"
            value={localWhy}
            onChange={e => {
              setLocalWhy(e.target.value);
              saveNotes(localGoal, e.target.value, localReflection);
            }}
            placeholder="Why is this goal important to you?"
            className="w-full bg-transparent border-b border-white/20 focus:border-white text-white font-serif text-xl outline-none py-2 transition-colors italic text-[#cccccc]"
          />
        </div>
      </div>

      {/* Time Budget Summary */}
      {plannedMs > 0 && (
        <div className="w-full mb-6 flex flex-wrap gap-4 items-center justify-center liquid-panel py-3 px-6 rounded-md">
          <div className="font-mono text-xs uppercase tracking-widest text-[#aaaaaa] mr-4">Time Budget</div>
          <div className="flex flex-wrap gap-6 items-center">
            {Object.entries(categoryTimeMap).map(([catId, ms]) => {
              const cat = categories.find(c => c.id === catId) || categories.find(c => c.isUncategorized);
              const hrs = (ms / 3600000).toFixed(1).replace(/\.0$/, '');
              return (
                <div key={catId} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color || '#555' }}></div>
                  <span className="font-serif text-white text-sm">{cat?.name || 'Uncategorized'}: <span className="font-mono text-red-400">{hrs}h</span></span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#aaaaaa]">Total:</span>
              <span className="font-mono text-white">{(plannedMs / 3600000).toFixed(1).replace(/\.0$/, '')}h</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 flex-1 min-h-0">
        
        {/* Unscheduled Tasks */}
        <div className="flex-1 flex flex-col liquid-panel p-6 rounded-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-mono text-sm text-white uppercase tracking-widest flex items-center gap-3">
              <span>Unscheduled</span>
              <span className="text-[#555555] text-xs">{unscheduledTasks.length}</span>
            </h3>
            {unscheduledTasks.length > 0 && (
              <button 
                onClick={handleOptimizeSchedule}
                className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest px-3 py-1 border border-emerald-500/30 hover:border-emerald-500/80 rounded-sm bg-emerald-500/10"
              >
                ✨ Optimize Day
              </button>
            )}
          </div>
          
          <form onSubmit={handleAddUnscheduled} className="mb-6 flex flex-col gap-2">
            <div className="flex gap-2">
              <input 
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Add task to plan..."
                className="flex-1 liquid-input text-white text-sm px-3 py-2 outline-none font-sans"
              />
              <div className="w-40 shrink-0">
                <CategoryPicker 
                  categories={categories}
                  categoryActions={categoryActions}
                  value={newTaskCategoryId}
                  onChange={setNewTaskCategoryId}
                  mode="dropdown"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <LiquidNumberInput
                  value={newTaskEstimatedMinutes}
                  onChange={(val) => setNewTaskEstimatedMinutes(val.toString())}
                  placeholder="Estimated Time (mins)"
                  className="w-full bg-transparent text-white text-left font-mono text-sm px-3 py-2 outline-none"
                  min={1}
                />
              </div>
              <button type="submit" className="liquid-button text-white px-8 text-xs font-mono uppercase tracking-widest shrink-0">Add</button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {unscheduledTasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <span className="font-mono text-xs text-[#555555] uppercase tracking-widest">No unscheduled tasks</span>
              </div>
            ) : (
              unscheduledTasks.map(task => {
                const cat = categories.find(c => c.id === task.categoryId) || categories.find(c => c.isUncategorized);
                return (
                  <div 
                    key={task.id} 
                    className={`relative overflow-hidden bg-black/30 p-3 rounded-sm border flex flex-col gap-2 group transition-all ${
                      task.status === 'Completed' ? 'border-emerald-500/50 opacity-50' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Category Tint Background */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: cat?.color || '#555' }}></div>
                    
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <button 
                          onClick={() => {
                            const isCompleting = task.status !== 'Completed';
                            blockActions.updateBlock(currentDate, { 
                              ...task, 
                              status: isCompleting ? 'Completed' : 'Pending',
                              accumulatedTimeMs: isCompleting ? (task.estimatedDurationMs || 25 * 60000) : 0
                            });
                          }}
                          className={`w-3 h-3 shrink-0 rounded-full border ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-[#555] hover:border-white'} transition-colors`}
                          title={task.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
                        />
                        <span className={`font-serif text-white text-sm truncate ${task.status === 'Completed' ? 'line-through text-emerald-400' : ''}`}>{task.title}</span>
                      </div>
                      {task.estimatedDurationMs && (
                        <span className="font-mono text-[10px] text-[#aaaaaa] shrink-0">
                          {Math.round(task.estimatedDurationMs / 60000)}m
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onStartFocus && (
                        <button 
                          onClick={() => onStartFocus(task)}
                          className="text-white hover:text-emerald-400 transition-colors font-mono text-[10px] uppercase tracking-widest"
                        >
                          Start
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenScheduleModal(task)}
                        className="text-white hover:text-blue-400 transition-colors font-mono text-[10px] uppercase tracking-widest"
                      >
                        Schedule
                      </button>
                      <button 
                        onClick={() => blockActions.deleteBlock(task.date, task.id)}
                        className="text-red-500 hover:text-red-400 transition-colors font-mono text-[10px] uppercase tracking-widest"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Scheduled Tasks */}
        <div className="flex-1 flex flex-col liquid-panel p-6 rounded-md relative">
          <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 flex justify-between items-center">
            <span>Scheduled Tasks</span>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleOpenCreateModal}
                className="text-[10px] font-mono text-white hover:text-red-400 transition-colors uppercase tracking-widest"
              >
                + Add Entry
              </button>
              <span className="text-[#555555]">{scheduledTasks.length}</span>
            </div>
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {scheduledTasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <span className="font-mono text-xs text-[#555555] uppercase tracking-widest leading-relaxed">
                  No time blocks planned yet.<br/>Go to Grid Entry to allocate your time.
                </span>
              </div>
            ) : (
              scheduledTasks.map(task => {
                const cat = categories.find(c => c.id === task.categoryId) || categories.find(c => c.isUncategorized);
                const formatTime = (ms: number) => {
                  const d = new Date(ms);
                  const pad = (n: number) => n.toString().padStart(2, '0');
                  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
                };
                const totalDurationMs = task.endTime - task.startTime;
                const progressPercentage = task.accumulatedTimeMs ? Math.min(100, Math.max(0, (task.accumulatedTimeMs / totalDurationMs) * 100)) : 0;
                
                return (
                  <div 
                    key={task.id} 
                    className={`relative overflow-hidden bg-black/30 p-3 rounded-sm border flex flex-col gap-2 group transition-all ${
                      task.status === 'Completed' ? 'border-emerald-500/50 opacity-50' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Category Tint Background */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: cat?.color || '#555' }}></div>
                    
                    {/* Progress Bar Background */}
                    {progressPercentage > 0 && task.status !== 'Completed' && (
                      <div className="absolute bottom-0 left-0 h-[2px] bg-white/30 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    )}

                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <button 
                          onClick={() => {
                            if (task.status === 'Completed') {
                              blockActions.updateBlock(currentDate, { ...task, status: 'Pending', accumulatedTimeMs: 0 });
                              return;
                            }
                            
                            if (task.endTime < Date.now()) {
                              setCompletionPrompt({ block: task });
                            } else {
                              blockActions.updateBlock(currentDate, { 
                                ...task, 
                                status: 'Completed',
                                accumulatedTimeMs: task.endTime - task.startTime
                              });
                            }
                          }}
                          className={`w-3 h-3 shrink-0 rounded-full border mt-0.5 ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-[#555] hover:border-white'} transition-colors`}
                          title={task.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
                        />
                        <span className={`font-serif text-white text-sm break-words ${task.status === 'Completed' ? 'line-through text-emerald-400' : ''}`}>{task.title}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#aaaaaa]">
                        {formatTime(task.startTime)} - {formatTime(task.endTime)}
                      </span>
                    </div>
                    {task.description && (
                      <p className="font-mono text-[10px] text-[#aaaaaa] pl-5 italic truncate">
                        {task.description}
                      </p>
                    )}
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      {onStartFocus && (
                        <button 
                          onClick={() => onStartFocus(task)}
                          className="text-white hover:text-emerald-400 transition-colors font-mono text-[10px] uppercase tracking-widest"
                        >
                          Start
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenScheduleModal(task)}
                        className="text-white hover:text-blue-400 transition-colors font-mono text-[10px] uppercase tracking-widest"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => blockActions.deleteBlock(task.date, task.id)}
                        className="text-red-500 hover:text-red-400 transition-colors font-mono text-[10px] uppercase tracking-widest"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Modal */}
      {modalMode !== 'hidden' && (
        <div
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setModalMode('hidden')}></div>
          <div className="relative w-full sm:max-w-md liquid-panel p-6 sm:p-8 rounded-t-xl sm:rounded-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-mono text-xl text-white font-bold tracking-widest mb-6">
              {modalMode === 'edit' ? 'Schedule Task' : 'Add Scheduled Task'}
            </h2>
            
            {conflictError && (
              <div className="mb-4 text-red-500 text-xs font-mono font-bold bg-red-500/10 p-2 rounded border border-red-500/20">
                {conflictError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-xs text-white font-mono mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editStartTimeStr}
                    onChange={(e) => setEditStartTimeStr(e.target.value)}
                    className="w-full liquid-input text-white text-sm px-2 py-2 outline-none min-h-[44px]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-white font-mono mb-1">End Time</label>
                  <input
                    type="time"
                    value={editEndTimeStr}
                    onChange={(e) => setEditEndTimeStr(e.target.value)}
                    className="w-full liquid-input text-white text-sm px-2 py-2 outline-none min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white font-mono mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full liquid-input text-white text-sm px-2 py-2 outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs text-white font-mono mb-1">Category</label>
                <CategoryPicker
                  categories={categories}
                  categoryActions={categoryActions}
                  value={editCategoryId}
                  onChange={setEditCategoryId}
                  mode="dropdown"
                />
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
                className="flex-1 py-2 liquid-button text-white hover:text-red-400 font-mono text-xs tracking-widest uppercase min-h-[44px]"
              >
                Save
              </button>
              <button
                onClick={() => setModalMode('hidden')}
                className="flex-1 py-2 liquid-button text-white font-mono text-xs tracking-widest uppercase focus:ring-2 focus:ring-white outline-none min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Prompt Modal */}
      {completionPrompt && (
        <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setCompletionPrompt(null)}></div>
          <div className="relative w-full sm:max-w-sm liquid-panel p-6 sm:p-8 rounded-t-xl sm:rounded-md border border-[#333] max-h-[90vh] overflow-y-auto">
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
                className="w-full py-3 bg-[#222] hover:bg-[#333] text-white font-mono uppercase tracking-widest text-xs transition-colors rounded-sm min-h-[44px]"
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
                className="w-full py-3 liquid-button text-emerald-400 hover:text-emerald-300 border-emerald-500/30 hover:border-emerald-500 font-mono uppercase tracking-widest text-xs transition-colors rounded-sm min-h-[44px]"
              >
                Complete & Log
              </button>
            </div>
            <button 
              onClick={() => setCompletionPrompt(null)}
              className="w-full mt-4 py-2 text-[#555] hover:text-white font-mono uppercase tracking-widest text-[10px] transition-colors min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
