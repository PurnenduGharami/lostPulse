import { useState, useEffect, useRef } from 'react';
import type { TimeBlock, UserProfile, BlockActions, Category, CategoryActions } from '../types';
import { v4 as uuidv4 } from 'uuid';
import CategoryPicker from './CategoryPicker';
import { formatTimeString } from '../utils';
import LiquidSelect from './LiquidSelect';
import LiquidNumberInput from './LiquidNumberInput';
import { getBlocksForDay } from '../utils';

interface FocusSessionProps {
  userProfile: UserProfile;
  timeBlocks: Record<string, TimeBlock[]>;
  blockActions: BlockActions;
  categories: Category[];
  categoryActions: CategoryActions;
  trackerBlockActions?: BlockActions; // Added for tracker sync
}

export default function FocusSession({ timeBlocks, blockActions, categories, categoryActions, trackerBlockActions }: FocusSessionProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  
  const [elapsed, setElapsed] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  
  const [categoryId, setCategoryId] = useState(() => {
     const fallback = categories.find(c => c.isUncategorized);
     return fallback ? fallback.id : 'uncategorized';
  });
  
  const [recoveryData, setRecoveryData] = useState<{ time: number, pauseTime: number | null, title: string, desc: string, category: string } | null>(null);
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [tempDesc, setTempDesc] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('custom');

  const [customDurationMs, setCustomDurationMs] = useState<number>(() => {
    const saved = localStorage.getItem('focusSessionCustomDurationMs');
    return saved ? parseInt(saved, 10) : 25 * 60000;
  });

  const getTodayStr = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const plannedTasksForToday = getBlocksForDay(timeBlocks, getTodayStr());
  
  const selectedTask = plannedTasksForToday.find(t => t.id === selectedTaskId);
  const allocatedMs = selectedTask 
    ? (selectedTask.startTime !== selectedTask.endTime 
        ? selectedTask.endTime - selectedTask.startTime 
        : (selectedTask.estimatedDurationMs || customDurationMs))
    : customDurationMs;
    
  const taskAccumulatedMs = selectedTask?.accumulatedTimeMs || 0;
  
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const savedTime = localStorage.getItem('focusSessionStartTime');
    const savedPause = localStorage.getItem('focusSessionPauseTime');
    const savedTitle = localStorage.getItem('focusSessionTitle');
    const savedDesc = localStorage.getItem('focusSessionDesc');
    const savedCategory = localStorage.getItem('focusSessionCategory');
    const savedTaskId = localStorage.getItem('focusSessionTaskId');
    
    if (savedTime) {
      const isRecovered = sessionStorage.getItem('focusSessionRecovered');
      if (!isRecovered) {
        setRecoveryData({
          time: parseInt(savedTime, 10),
          pauseTime: savedPause ? parseInt(savedPause, 10) : null,
          title: savedTitle || '',
          desc: savedDesc || '',
          category: savedCategory || categoryId
        });
        return;
      }

      setStartTime(parseInt(savedTime, 10));
      if (savedPause) setPauseStartTime(parseInt(savedPause, 10));
      if (savedTitle) setSessionTitle(savedTitle);
      if (savedDesc) setSessionDescription(savedDesc);
      if (savedCategory) setCategoryId(savedCategory);
      if (savedTaskId) setSelectedTaskId(savedTaskId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const isInView = () => {
      if (!containerRef.current) return false;
      const rect = containerRef.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      return center >= 0 && center <= window.innerHeight;
    };

    const handleSpace = () => {
      if (!isInView()) return;
      if (recoveryData) return;
      if (isDescModalOpen) return;
      
      // Toggle logic
      if (startTime === null) {
        handleStart();
      } else if (pauseStartTime === null) {
        handlePause();
      } else {
        handleResume();
      }
    };

    window.addEventListener('global-shortcut-space', handleSpace);
    return () => window.removeEventListener('global-shortcut-space', handleSpace);
  });

  useEffect(() => {
    if (startTime !== null) {
      const animate = () => {
        let currentElapsed = 0;
        if (pauseStartTime !== null) {
          currentElapsed = pauseStartTime - startTime;
        } else {
          currentElapsed = Date.now() - startTime;
        }
        
        const totalElapsed = currentElapsed + taskAccumulatedMs;
        
        if (allocatedMs > 0 && totalElapsed >= allocatedMs) {
          setElapsed(allocatedMs);
          if (pauseStartTime === null) {
            // Auto complete when countdown hits 0
            if (selectedTask) {
              blockActions.updateBlock(getTodayStr(), { 
                ...selectedTask, 
                status: 'Completed',
                accumulatedTimeMs: allocatedMs
              });
            }
            setStartTime(null);
            setPauseStartTime(null);
            clearStorage();
          }
        } else {
          setElapsed(totalElapsed);
        }
        
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
    } else {
      setElapsed(taskAccumulatedMs);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [startTime, pauseStartTime, taskAccumulatedMs, allocatedMs]);

  const handleStart = () => {
    if (localStorage.getItem('activeSessionStartTime')) {
      setErrorMsg("Cannot start Focus Session while a Live Session is active.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const now = Date.now();
    setStartTime(now);
    setPauseStartTime(null);
    localStorage.setItem('focusSessionStartTime', now.toString());
    localStorage.removeItem('focusSessionPauseTime');
    localStorage.setItem('focusSessionTitle', sessionTitle);
    localStorage.setItem('focusSessionDesc', sessionDescription);
    localStorage.setItem('focusSessionCategory', categoryId);
    localStorage.setItem('focusSessionTaskId', selectedTaskId);
    sessionStorage.setItem('focusSessionRecovered', 'true');
    
    if (selectedTask) {
      blockActions.updateBlock(getTodayStr(), { ...selectedTask, status: 'In Progress' });
    }
  };

  const handlePause = () => {
    if (startTime === null || pauseStartTime !== null) return;
    const now = Date.now();
    const elapsedThisSession = now - startTime;
    
    setStartTime(now);
    setPauseStartTime(now);
    localStorage.setItem('focusSessionStartTime', now.toString());
    localStorage.setItem('focusSessionPauseTime', now.toString());
    
    if (selectedTask) {
      const newAccumulated = taskAccumulatedMs + elapsedThisSession;
      blockActions.updateBlock(getTodayStr(), { 
        ...selectedTask, 
        status: 'Paused',
        accumulatedTimeMs: newAccumulated
      });
    }
  };

  const handleResume = () => {
    if (startTime === null || pauseStartTime === null) return;
    const now = Date.now();
    
    setStartTime(now);
    setPauseStartTime(null);
    
    localStorage.setItem('focusSessionStartTime', now.toString());
    localStorage.removeItem('focusSessionPauseTime');
    
    if (selectedTask) {
      blockActions.updateBlock(getTodayStr(), { ...selectedTask, status: 'In Progress' });
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('focusSessionStartTime');
    localStorage.removeItem('focusSessionPauseTime');
    localStorage.removeItem('focusSessionTitle');
    localStorage.removeItem('focusSessionDesc');
    localStorage.removeItem('focusSessionCategory');
    localStorage.removeItem('focusSessionTaskId');
    sessionStorage.removeItem('focusSessionRecovered');
  };

  const handleFinish = () => {
    if (startTime === null) return;
    
    const endTime = pauseStartTime !== null ? pauseStartTime : Date.now();
    const durationMinutes = (endTime - startTime) / 60000;

    if (durationMinutes < 1 && selectedTaskId === 'custom') {
      setErrorMsg("Session must be at least 1 minute to save.");
      setTimeout(() => setErrorMsg(null), 3000);
      setStartTime(null);
      setPauseStartTime(null);
      clearStorage();
      return;
    }

    const d = new Date(startTime);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (selectedTask) {
      const trackerEntryId = uuidv4();
      const newAccumulated = taskAccumulatedMs + durationMinutes * 60000;
      blockActions.updateBlock(dateStr, { 
        ...selectedTask, 
        status: 'Completed', 
        description: sessionDescription || selectedTask.description,
        accumulatedTimeMs: newAccumulated,
        linkedTrackerEntryId: trackerEntryId
      });
      
      if (trackerBlockActions) {
        const newTrackerBlock: TimeBlock = {
          id: trackerEntryId,
          title: selectedTask.title,
          description: sessionDescription || selectedTask.description,
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          status: 'Completed',
          categoryId: selectedTask.categoryId || categoryId,
          accumulatedTimeMs: durationMinutes * 60000,
          createdAt: Date.now(),
          linkedPlannerTaskId: selectedTask.id
        };
        trackerBlockActions.saveBlock(dateStr, newTrackerBlock);
      }
    } else {
      const newBlock: TimeBlock = {
        id: uuidv4(),
        title: sessionTitle || 'Deep Work',
        description: sessionDescription || undefined,
        date: dateStr,
        startTime: startTime,
        endTime: endTime,
        status: 'Completed',
        categoryId: categoryId,
        accumulatedTimeMs: durationMinutes * 60000,
        createdAt: Date.now()
      };
      if (trackerBlockActions) {
        trackerBlockActions.saveBlock(dateStr, newBlock);
      } else {
        blockActions.saveBlock(dateStr, newBlock); // Fallback
      }
    }
    
    setStartTime(null);
    setPauseStartTime(null);
    setSessionTitle('');
    setSessionDescription('');
    setSelectedTaskId('custom');
    clearStorage();
  };

  const handleCancel = () => {
    setStartTime(null);
    setPauseStartTime(null);
    clearStorage();
  };

  const handleRecoverContinue = () => {
    if (!recoveryData) return;
    setStartTime(recoveryData.time);
    setPauseStartTime(recoveryData.pauseTime);
    setSessionTitle(recoveryData.title);
    setSessionDescription(recoveryData.desc);
    setCategoryId(recoveryData.category);
    sessionStorage.setItem('focusSessionRecovered', 'true');
    setRecoveryData(null);
  };

  const handleRecoverFinish = () => {
    if (!recoveryData) return;
    const endTime = recoveryData.pauseTime !== null ? recoveryData.pauseTime : Date.now();
    const durationMinutes = (endTime - recoveryData.time) / 60000;

    if (durationMinutes >= 1) {
      const d = new Date(recoveryData.time);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const newBlock: TimeBlock = {
        id: uuidv4(),
        title: recoveryData.title || 'Deep Work',
        description: recoveryData.desc || undefined,
        date: dateStr,
        startTime: recoveryData.time,
        endTime: endTime,
        status: 'Completed',
        categoryId: recoveryData.category,
        accumulatedTimeMs: durationMinutes * 60000,
        createdAt: Date.now()
      };
      blockActions.saveBlock(dateStr, newBlock);
    } else {
      setErrorMsg("Recovered session was less than 1 minute and was discarded.");
      setTimeout(() => setErrorMsg(null), 3000);
    }
    
    clearStorage();
    setRecoveryData(null);
  };

  const formatTime = (ms: number, isCountdown: boolean = false) => {
    let target = ms;
    if (isCountdown) {
      target = Math.max(0, allocatedMs - ms);
    }
    
    const totalSeconds = Math.floor(target / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
      {errorMsg && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 liquid-panel border-red-500 text-white px-4 py-2 rounded-md font-mono text-xs shadow-lg animate-pulse mt-4">
          {errorMsg}
        </div>
      )}

      {recoveryData && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>
          <div className="relative w-full sm:max-w-md liquid-panel p-6 sm:p-8 rounded-t-xl sm:rounded-md text-center max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl sm:text-2xl text-white mb-4">Unfinished Session Detected</h2>
            <p className="text-[#aaaaaa] font-mono text-xs sm:text-sm mb-6">
              It looks like the app was closed while a session was running. 
              <br/><br/>
              <strong className="text-white">{recoveryData.title || 'Deep Work'}</strong>
              <br/>
              Started at: {formatTimeString(recoveryData.time)}
              {recoveryData.pauseTime && <><br/>(Paused)</>}
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={handleRecoverContinue}
                className="flex-1 py-3 liquid-button text-white font-mono uppercase tracking-widest text-xs min-h-[44px]"
              >
                Resume
              </button>
              <button 
                onClick={handleRecoverFinish}
                className="flex-1 py-3 bg-red-600/80 hover:bg-red-500 backdrop-blur-md border border-red-500/50 text-white font-mono uppercase tracking-widest text-xs transition-colors shadow-lg min-h-[44px]"
              >
                Finish & Save
              </button>
            </div>
            <button 
              onClick={() => {
                clearStorage();
                setRecoveryData(null);
              }}
              className="mt-6 text-[10px] font-mono text-[#555555] hover:text-red-500 uppercase tracking-widest underline min-h-[44px]"
            >
              Discard Session
            </button>
          </div>
        </div>
      )}

      {isDescModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setIsDescModalOpen(false)}></div>
          <div className="relative w-full sm:max-w-lg liquid-panel p-6 rounded-t-xl sm:rounded-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-mono text-lg text-white font-bold tracking-widest mb-4">Session Description</h2>
            <textarea
              autoFocus
              value={tempDesc}
              onChange={(e) => setTempDesc(e.target.value)}
              className="w-full liquid-input text-white text-sm px-3 py-3 outline-none mb-6 font-mono resize-none h-32"
              placeholder="Optional notes or context for this session..."
            />
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  setSessionDescription(tempDesc);
                  if (startTime !== null) {
                    localStorage.setItem('focusSessionDesc', tempDesc);
                  }
                  setIsDescModalOpen(false);
                }} 
                className="flex-1 py-2 liquid-button text-white hover:text-red-400 font-mono text-xs tracking-widest uppercase min-h-[44px]"
              >
                Save
              </button>
              <button 
                onClick={() => setIsDescModalOpen(false)} 
                className="flex-1 py-2 liquid-button text-white font-mono text-xs tracking-widest uppercase min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Vertical Flow Container */}
      <div className="w-full max-w-4xl flex flex-col items-center justify-center space-y-6 sm:space-y-12">
        
        {/* Activity & Description */}
        <div className="flex flex-col items-center space-y-4 w-full px-4">
          <div className="relative flex flex-col items-center justify-center w-full max-w-4xl">
            <div className="relative flex-shrink-0 grid">
              {selectedTaskId === 'custom' || startTime !== null ? (
                <>
                  {/* Invisible span forces the container width to match the text */}
                  <span className={`invisible whitespace-pre col-start-1 row-start-1 px-2 font-serif ${startTime !== null ? 'text-2xl sm:text-3xl md:text-5xl' : 'text-xl sm:text-2xl md:text-4xl'}`}>
                    {sessionTitle || "What are you focusing on?"}
                  </span>
                  <input 
                    type="text"
                    value={sessionTitle}
                    onChange={(e) => {
                      setSessionTitle(e.target.value);
                      if (startTime !== null) {
                        localStorage.setItem('focusSessionTitle', e.target.value);
                      }
                    }}
                    className={`col-start-1 row-start-1 bg-transparent text-white font-serif focus:outline-none transition-colors w-full px-2 placeholder:text-white/30 text-center ${startTime !== null ? 'text-2xl sm:text-3xl md:text-5xl' : 'text-xl sm:text-2xl md:text-4xl'}`}
                    placeholder="What are you focusing on?"
                  />
                </>
              ) : (
                <div className={`bg-transparent text-white font-serif truncate px-2 text-center ${startTime === null && plannedTasksForToday.length > 0 ? 'text-xl sm:text-2xl md:text-4xl' : 'text-2xl sm:text-3xl md:text-5xl'}`}>
                  {sessionTitle || "No task selected"}
                </div>
              )}

              {/* Dropdown positioned absolutely to the right of the text so it doesn't push the text off-center */}
              {startTime === null && plannedTasksForToday.length > 0 && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-48 md:w-56 hidden md:block z-50">
                  <LiquidSelect
                    value={selectedTaskId}
                    onChange={(val) => {
                      setSelectedTaskId(val as string);
                      if (val !== 'custom') {
                        const t = plannedTasksForToday.find(b => b.id === val);
                        if (t) {
                          setSessionTitle(t.title);
                          setSessionDescription(t.description || '');
                          setCategoryId(t.categoryId || t.category || '');
                        }
                      } else {
                        setSessionTitle('');
                        setSessionDescription('');
                      }
                    }}
                    options={[
                      { value: 'custom', label: 'Custom Task...' },
                      ...plannedTasksForToday.map(t => ({ value: t.id, label: t.title }))
                    ]}
                    buttonClassName="text-sm px-4 py-3"
                  />
                </div>
              )}
            </div>
            
            {/* Mobile Dropdown (falls back to flow if screen is too small) */}
            {startTime === null && plannedTasksForToday.length > 0 && (
              <div className="w-full max-w-xs mt-4 md:hidden">
                <LiquidSelect
                  value={selectedTaskId}
                  onChange={(val) => {
                    setSelectedTaskId(val as string);
                    if (val !== 'custom') {
                      const t = plannedTasksForToday.find(b => b.id === val);
                      if (t) {
                        setSessionTitle(t.title);
                        setSessionDescription(t.description || '');
                        setCategoryId(t.categoryId || t.category || '');
                      }
                    } else {
                      setSessionTitle('');
                      setSessionDescription('');
                    }
                  }}
                  options={[
                    { value: 'custom', label: 'Custom Task...' },
                    ...plannedTasksForToday.map(t => ({ value: t.id, label: t.title }))
                  ]}
                  buttonClassName="text-sm px-4 py-3"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setTempDesc(sessionDescription);
              setIsDescModalOpen(true);
            }}
            className="text-[10px] font-mono tracking-widest uppercase transition-colors flex items-center space-x-2 px-3 py-1 rounded-sm group min-h-[44px]"
          >
            {sessionDescription ? (
               <span className="text-white group-hover:text-red-400">✎ Edit Description</span>
            ) : (
               <span className="text-[#555555] group-hover:text-white">+ Add Description</span>
            )}
          </button>

          {startTime === null && (!selectedTask || (selectedTask.startTime === selectedTask.endTime && !selectedTask.estimatedDurationMs)) && (
            <div className="flex items-center space-x-3 mt-4 sm:mt-8 opacity-70 hover:opacity-100 transition-opacity liquid-panel px-4 py-2 rounded-full border border-[#333333] min-h-[44px]">
               <span className="text-white text-[10px] font-mono uppercase tracking-widest">Duration</span>
               <LiquidNumberInput
                 value={customDurationMs / 60000}
                 onChange={(val) => {
                   const numVal = typeof val === 'number' ? val : (parseInt(val as string, 10) || 1);
                   setCustomDurationMs(numVal * 60000);
                   localStorage.setItem('focusSessionCustomDurationMs', (numVal * 60000).toString());
                 }}
                 min={1}
                 max={480}
               />
               <span className="text-[#aaaaaa] text-[10px] font-mono uppercase tracking-widest">min</span>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="text-[3.5rem] xs:text-[4.5rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] font-mono text-white tracking-tight font-bold drop-shadow-2xl leading-none">
          {formatTime(elapsed, true)}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {startTime === null ? (
            <button 
              onClick={handleStart}
              className="px-8 py-3 sm:px-12 sm:py-4 bg-[#8B0000] hover:bg-[#ff2222] text-white font-serif tracking-widest uppercase text-lg sm:text-2xl rounded-sm transition-all duration-300 shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:scale-105 min-h-[44px]"
            >
              Start Session
            </button>
          ) : (
            <>
              {pauseStartTime === null ? (
                <button 
                  onClick={handlePause}
                  className="px-6 py-2.5 sm:px-10 sm:py-4 liquid-button text-white hover:text-white/80 font-serif tracking-widest uppercase text-sm sm:text-xl rounded-sm transition-transform hover:scale-105 min-h-[44px]"
                >
                  Pause
                </button>
              ) : (
                <button 
                  onClick={handleResume}
                  className="px-6 py-2.5 sm:px-10 sm:py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-serif tracking-widest uppercase text-sm sm:text-xl rounded-sm transition-transform hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)] min-h-[44px]"
                >
                  Resume
                </button>
              )}
              <button 
                onClick={handleFinish}
                className="px-6 py-2.5 sm:px-10 sm:py-4 liquid-button text-white hover:text-red-400 font-serif tracking-widest uppercase text-sm sm:text-xl rounded-sm transition-transform hover:scale-105 min-h-[44px]"
              >
                Finish & Save
              </button>
              <button 
                onClick={handleCancel}
                className="px-5 py-2.5 sm:px-8 sm:py-4 liquid-button text-[#aaaaaa] hover:text-white font-serif tracking-widest uppercase text-xs sm:text-lg rounded-sm transition-transform hover:scale-105 min-h-[44px]"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Categories */}
        {selectedTaskId === 'custom' && (
          <div className="pt-8 w-full max-w-2xl flex justify-center">
            <CategoryPicker 
              categories={categories} 
              categoryActions={categoryActions} 
              value={categoryId} 
              onChange={(val) => {
                setCategoryId(val);
                if (startTime !== null) {
                  localStorage.setItem('focusSessionCategory', val);
                }
              }} 
              mode="buttons"
            />
          </div>
        )}
        
      </div>
    </div>
  );
}
