import type { UserProfile, TimeBlock } from './types';

export function formatDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const val = localStorage.getItem(`lostpulse_${key}`);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    localStorage.setItem(`lostpulse_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data:', err);
  }
}

export function hasOverlap(existingBlocks: TimeBlock[], startTime: number, endTime: number, excludeId?: string): boolean {
  return existingBlocks.some(b => {
    if (excludeId && b.id === excludeId) return false;
    return startTime < b.endTime && endTime > b.startTime;
  });
}

export function splitBlockAcrossMidnight(block: TimeBlock): Record<string, TimeBlock[]> {
  const result: Record<string, TimeBlock[]> = {};
  const start = new Date(block.startTime);
  const end = new Date(block.endTime);

  const startDayStr = formatDateKey(start);
  const endDayStr = formatDateKey(end);

  if (startDayStr === endDayStr) {
    result[startDayStr] = [block];
    return result;
  }

  // Midnight crossover splitting
  const midnight = new Date(start);
  midnight.setHours(24, 0, 0, 0);

  const part1: TimeBlock = { ...block, endTime: midnight.getTime() };
  const part2: TimeBlock = { ...block, id: `${block.id}_cont`, startTime: midnight.getTime() };

  result[startDayStr] = [part1];
  const restSplit = splitBlockAcrossMidnight(part2);
  for (const [dStr, arr] of Object.entries(restSplit)) {
    result[dStr] = [...(result[dStr] || []), ...arr];
  }

  return result;
}

export function calculateLifeRemaining(profile: UserProfile | null) {
  if (!profile) return { years: 0, days: 0, hours: 0, percentage: 0 };
  const birth = new Date(profile.birthDate).getTime();
  const targetMs = profile.targetLifespanYears * 365.25 * 24 * 3600 * 1000;
  const deathEstimate = birth + targetMs;
  const now = Date.now();

  const remainingMs = Math.max(0, deathEstimate - now);
  const totalMs = targetMs;
  const percentage = Math.min(100, Math.max(0, ((now - birth) / totalMs) * 100));

  const years = Math.floor(remainingMs / (365.25 * 24 * 3600 * 1000));
  const days = Math.floor((remainingMs % (365.25 * 24 * 3600 * 1000)) / (24 * 3600 * 1000));
  const hours = Math.floor((remainingMs % (24 * 3600 * 1000)) / (3600 * 1000));

  return { years, days, hours, percentage };
}

export function getMaxHoursInSingleDay(timeBlocks: Record<string, TimeBlock[]>): number {
  let max = 0;
  for (const blocks of Object.values(timeBlocks)) {
    const totalMs = blocks.reduce((acc, b) => acc + (b.endTime - b.startTime), 0);
    const hours = totalMs / (3600 * 1000);
    if (hours > max) max = hours;
  }
  return max;
}

export function getCompletedDaysCount(timeBlocks: Record<string, TimeBlock[]>, currentDayStr: string): number {
  return Object.keys(timeBlocks).filter(d => d !== currentDayStr && (timeBlocks[d]?.length || 0) > 0).length;
}

export function checkLiveSessionCollision(startTime: number, endTime: number): boolean {
  const liveStart = localStorage.getItem('activeSessionStartTime');
  const livePause = localStorage.getItem('activeSessionPauseTime');
  if (!liveStart || livePause) return false;
  const startNum = parseInt(liveStart, 10);
  const now = Date.now();
  return startTime < now && endTime > startNum;
}

// Web Audio Chime Synthesizer
export function playPulseChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime); // Solfeggio frequency

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 2.5);
  } catch {
    // AudioContext blocked or unsupported
  }
}
