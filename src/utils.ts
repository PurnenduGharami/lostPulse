import type { UserProfile } from './types';

// Storage Abstraction
export const loadData = async <T>(key: string): Promise<T | null> => {
  if (window.electronAPI) {
    return await window.electronAPI.loadData(key);
  }
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const saveData = async <T>(key: string, data: T): Promise<boolean> => {
  if (window.electronAPI) {
    return await window.electronAPI.saveData(key, data);
  }
  localStorage.setItem(key, JSON.stringify(data));
  return true;
};

export const formatTimeString = (ts: number, profile?: UserProfile | null) => {
  let use24 = false;
  if (profile) {
    use24 = profile.use24HourFormat ?? false;
  } else {
    try {
      const pStr = localStorage.getItem('userProfile');
      if (pStr) {
        use24 = JSON.parse(pStr).use24HourFormat ?? false;
      }
    } catch (e) {}
  }
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24 });
};

// Mathematical Engines
export const calculateLifeRemaining = (profile: UserProfile | null) => {
  if (!profile || !profile.birthDate || !profile.targetLifespan) {
    return { years: 0, days: 0, hours: 0, minutes: 0, seconds: 0, percentage: 0 };
  }

  const birth = new Date(profile.birthDate).getTime();
  const now = new Date().getTime();
  const end = new Date(profile.birthDate);
  end.setFullYear(end.getFullYear() + profile.targetLifespan);
  const endTime = end.getTime();

  const remainingMs = Math.max(0, endTime - now);
  const totalMs = Math.max(1, endTime - birth);
  
  const seconds = Math.floor((remainingMs / 1000) % 60);
  const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
  const hours = Math.floor((remainingMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor((remainingMs / (1000 * 60 * 60 * 24)) % 365.25);
  const years = Math.floor(remainingMs / (1000 * 60 * 60 * 24 * 365.25));

  const percentage = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const isOverdue = now > endTime;

  return { years, days, hours, minutes, seconds, percentage, isOverdue };
};

// Domain Logic Centralization (Epic 7: Single Source of Truth)

/**
 * Safely returns all blocks touching a specific 24-hour period (including overlapping blocks from the previous day).
 */
export const getBlocksForDay = (timeBlocks: Record<string, import('./types').TimeBlock[]>, dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d, 0, 0, 0).getTime();
  
  const yesterdayDate = new Date(y, m - 1, d - 1);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${pad(yesterdayDate.getMonth() + 1)}-${pad(yesterdayDate.getDate())}`;

  const todayBlocks = timeBlocks[dateStr] || [];
  const yesterdayBlocks = timeBlocks[yesterdayStr] || [];
  
  // Only blocks from yesterday that cross into today
  const overlappingYesterday = yesterdayBlocks.filter(b => b.endTime > baseDate);

  return [...overlappingYesterday, ...todayBlocks];
};

/**
 * Checks for generic block collisions.
 */
export const hasOverlap = (blocks: import('./types').TimeBlock[], startTime: number, endTime: number, ignoreBlockId?: string) => {
  return blocks.some(b => {
    if (ignoreBlockId && b.id === ignoreBlockId) return false;
    return (startTime < b.endTime && endTime > b.startTime);
  });
};

/**
 * Returns the specific block that causes a collision.
 */
export const findOverlappingBlock = (blocks: import('./types').TimeBlock[], startTime: number, endTime: number, ignoreBlockId?: string) => {
  return blocks.find(b => {
    if (ignoreBlockId && b.id === ignoreBlockId) return false;
    return (startTime < b.endTime && endTime > b.startTime);
  });
};

/**
 * Checks for collisions against the active Live Session in localStorage.
 * Returns the active session's start time if a collision occurs, otherwise null.
 */
export const checkLiveSessionCollision = (startTime: number, endTime: number): number | null => {
  const activeSessionStr = localStorage.getItem('activeSessionStartTime');
  if (activeSessionStr) {
    const activeStart = parseInt(activeSessionStr, 10);
    const activeEnd = Date.now();
    if (startTime < activeEnd && endTime > activeStart) {
      return activeStart;
    }
  }
  return null;
};

// Extend Window interface for electronAPI
declare global {
  interface Window {
    electronAPI?: {
      loadData: (key: string) => Promise<any>;
      saveData: (key: string, data: any) => Promise<boolean>;
      exportMarkdown: (content: string, filename: string) => Promise<boolean>;
      clearData: () => Promise<boolean>;
    };
}
}

/**
 * Automatically splits a block that crosses midnight into multiple blocks.
 */
export const splitBlockAcrossMidnight = (block: import('./types').TimeBlock): Record<string, import('./types').TimeBlock[]> => {
  const result: Record<string, import('./types').TimeBlock[]> = {};
  
  let currentStart = block.startTime;
  const end = block.endTime;
  
  while (currentStart < end) {
    const startDate = new Date(currentStart);
    const y = startDate.getFullYear();
    const m = startDate.getMonth();
    const d = startDate.getDate();
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`;
    
    // Midnight of the next day
    const nextMidnight = new Date(y, m, d + 1, 0, 0, 0).getTime();
    
    const currentEnd = Math.min(end, nextMidnight);
    
    if (!result[dateStr]) {
      result[dateStr] = [];
    }
    
    result[dateStr].push({
      ...block,
      // Keep original ID for the first part, assign new IDs to subsequent parts
      id: currentStart === block.startTime ? block.id : Math.random().toString(36).substr(2, 9),
      startTime: currentStart,
      endTime: currentEnd,
    });
    currentStart = currentEnd;
  }
  
  return result;
};

/**
 * Calculates the visual layout for overlapping blocks using a simple cluster algorithm.
 * Returns a map of blockId -> { width: number, left: number } (percentages 0-100)
 */
export const calculateBlockLayout = (blocks: import('./types').TimeBlock[]) => {
  const layout = new Map<string, { width: number, left: number }>();
  if (blocks.length === 0) return layout;

  const sorted = [...blocks].sort((a, b) => a.startTime - b.startTime || b.endTime - a.endTime);
  
  // Group into overlapping clusters
  const clusters: import('./types').TimeBlock[][] = [];
  let currentCluster: import('./types').TimeBlock[] = [];
  let clusterEnd = -1;
  
  sorted.forEach(block => {
    if (block.startTime >= clusterEnd) {
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }
      currentCluster = [block];
      clusterEnd = block.endTime;
    } else {
      currentCluster.push(block);
      clusterEnd = Math.max(clusterEnd, block.endTime);
    }
  });
  if (currentCluster.length > 0) clusters.push(currentCluster);

  // Process each cluster
  clusters.forEach(cluster => {
    const columns: import('./types').TimeBlock[][] = [];
    
    cluster.forEach(block => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const lastBlock = col[col.length - 1];
        if (lastBlock.endTime <= block.startTime) {
          col.push(block);
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([block]);
      }
    });
    
    const numCols = columns.length;
    const width = 100 / numCols;
    
    columns.forEach((col, colIdx) => {
      col.forEach(block => {
        layout.set(block.id, {
          width,
          left: colIdx * width
        });
      });
    });
  });

  return layout;
};

/**
 * Calculates the maximum total hours tracked in any single day.
 */
export const getMaxHoursInSingleDay = (timeBlocks: Record<string, import('./types').TimeBlock[]>): number => {
  let maxHours = 0;
  for (const dateStr in timeBlocks) {
    let dayTotalMs = 0;
    timeBlocks[dateStr].forEach(block => {
      dayTotalMs += (block.endTime - block.startTime);
    });
    const hours = dayTotalMs / 3600000;
    if (hours > maxHours) {
      maxHours = hours;
    }
  }
  return maxHours;
};

/**
 * Calculates the effective duration for a list of blocks, splitting overlapping time evenly.
 * Returns an object mapping block.id to its effective duration in milliseconds.
 */
export const calculateEffectiveDurations = (blocks: import('./types').TimeBlock[]): Record<string, number> => {
  const durations: Record<string, number> = {};
  
  if (blocks.length === 0) return durations;

  blocks.forEach(b => { durations[b.id] = 0; });

  // Create an array of events (start and end)
  const events: { time: number, type: 'start' | 'end', id: string }[] = [];
  blocks.forEach(b => {
    if (b.startTime < b.endTime) {
      events.push({ time: b.startTime, type: 'start', id: b.id });
      events.push({ time: b.endTime, type: 'end', id: b.id });
    }
  });

  events.sort((a, b) => a.time - b.time);

  let activeBlocks = new Set<string>();
  let lastTime = events.length > 0 ? events[0].time : 0;

  for (const event of events) {
    const currentTime = event.time;
    if (currentTime > lastTime && activeBlocks.size > 0) {
      const timeDiff = currentTime - lastTime;
      const splitTime = timeDiff / activeBlocks.size;
      for (const id of activeBlocks) {
        durations[id] += splitTime;
      }
    }

    if (event.type === 'start') {
      activeBlocks.add(event.id);
    } else {
      activeBlocks.delete(event.id);
    }
    lastTime = currentTime;
  }

  return durations;
};

/**
 * Counts how many unique days before `beforeDateStr` have tracker data.
 */
export const getCompletedDaysCount = (timeBlocks: Record<string, import('./types').TimeBlock[]>, beforeDateStr: string): number => {
  let count = 0;
  for (const dateStr in timeBlocks) {
    if (dateStr < beforeDateStr && timeBlocks[dateStr].length > 0) {
      count++;
    }
  }
  return count;
};
