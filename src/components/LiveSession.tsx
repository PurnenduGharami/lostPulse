import { useState, useEffect, useRef } from 'react';
import type { TimeBlock, UserProfile, BlockActions, Category, CategoryActions } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { formatTimeString } from '../utils';
import CategoryPicker from './CategoryPicker';

interface LiveSessionProps {
  userProfile: UserProfile;
  blockActions: BlockActions;
  categories: Category[];
  categoryActions: CategoryActions;
}

export default function LiveSession({ blockActions, categories, categoryActions }: LiveSessionProps) {
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
  
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const savedTime = localStorage.getItem('activeSessionStartTime');
    const savedPause = localStorage.getItem('activeSessionPauseTime');
    const savedTitle = localStorage.getItem('activeSessionTitle');
    const savedDesc = localStorage.getItem('activeSessionDesc');
    const savedCategory = localStorage.getItem('activeSessionCategory');
    
    if (savedTime) {
      const isRecovered = sessionStorage.getItem('liveSessionRecovered');
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
        if (pauseStartTime !== null) {
          setElapsed(pauseStartTime - startTime);
        } else {
          setElapsed(Date.now() - startTime);
        }
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);
    } else {
      setElapsed(0);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [startTime, pauseStartTime]);

  const handleStart = () => {
    if (localStorage.getItem('focusSessionStartTime')) {
      setErrorMsg("Cannot start Live Session while a Planner Focus Session is active.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const now = Date.now();
    setStartTime(now);
    setPauseStartTime(null);
    localStorage.setItem('activeSessionStartTime', now.toString());
    localStorage.removeItem('activeSessionPauseTime');
    localStorage.setItem('activeSessionTitle', sessionTitle);
    localStorage.setItem('activeSessionDesc', sessionDescription);
    localStorage.setItem('activeSessionCategory', categoryId);
    sessionStorage.setItem('liveSessionRecovered', 'true');
  };

  const handlePause = () => {
    if (startTime === null || pauseStartTime !== null) return;
    const now = Date.now();
    setPauseStartTime(now);
    localStorage.setItem('activeSessionPauseTime', now.toString());
  };

  const handleResume = () => {
    if (startTime === null || pauseStartTime === null) return;
    const now = Date.now();
    const pausedDuration = now - pauseStartTime;
    const newStartTime = startTime + pausedDuration;
    
    setStartTime(newStartTime);
    setPauseStartTime(null);
    
    localStorage.setItem('activeSessionStartTime', newStartTime.toString());
    localStorage.removeItem('activeSessionPauseTime');
  };

  const clearStorage = () => {
    localStorage.removeItem('activeSessionStartTime');
    localStorage.removeItem('activeSessionPauseTime');
    localStorage.removeItem('activeSessionTitle');
    localStorage.removeItem('activeSessionDesc');
    localStorage.removeItem('activeSessionCategory');
    sessionStorage.removeItem('liveSessionRecovered');
  };

  const handleFinish = () => {
    if (startTime === null) return;
    
    const endTime = pauseStartTime !== null ? pauseStartTime : Date.now();
    const durationMinutes = (endTime - startTime) / 60000;

    if (durationMinutes < 1) {
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

    const newBlock: TimeBlock = {
      id: uuidv4(),
      title: sessionTitle || 'Deep Work',
      description: sessionDescription || undefined,
      date: dateStr,
      startTime: startTime,
      endTime: endTime,
      status: 'Completed',
      categoryId: categoryId,
      createdAt: Date.now()
    };

    blockActions.saveBlock(dateStr, newBlock);
    
    setStartTime(null);
    setPauseStartTime(null);
    setSessionTitle('');
    setSessionDescription('');
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
    sessionStorage.setItem('liveSessionRecovered', 'true');
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

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center relative p-8">
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
                    localStorage.setItem('activeSessionDesc', tempDesc);
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
        <div className="flex flex-col items-center space-y-4 w-full">
          <input 
            type="text"
            value={sessionTitle}
            onChange={(e) => {
              setSessionTitle(e.target.value);
              if (startTime !== null) {
                localStorage.setItem('activeSessionTitle', e.target.value);
              }
            }}
            className="bg-transparent text-white font-serif text-2xl sm:text-3xl md:text-5xl text-center focus:outline-none transition-colors w-full px-4"
            placeholder="What are you working on?"
          />
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
        </div>

        {/* Timer */}
        <div className="text-[3.5rem] xs:text-[4.5rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] font-mono text-white tracking-tight font-bold drop-shadow-2xl leading-none">
          {formatTime(elapsed)}
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
        <div className="pt-8 w-full max-w-2xl flex justify-center">
          <CategoryPicker 
            categories={categories} 
            categoryActions={categoryActions} 
            value={categoryId} 
            onChange={(val) => {
              setCategoryId(val);
              if (startTime !== null) {
                localStorage.setItem('activeSessionCategory', val);
              }
            }} 
            mode="buttons"
          />
        </div>
        
      </div>
    </div>
  );
}
