import { useState, useEffect } from 'react';
import type { DailyReflection } from '../types';

interface FinalReflectionCardProps {
  dateStr: string;
  reflection?: DailyReflection;
  onSaveReflection: (dateStr: string, reflection: DailyReflection) => void;
}

export default function FinalReflectionCard({ dateStr, reflection, onSaveReflection }: FinalReflectionCardProps) {
  const [wasWorthIt, setWasWorthIt] = useState<boolean | null>(reflection?.wasWorthIt ?? null);
  const [reason, setReason] = useState(reflection?.reason || '');
  const [isExpanded, setIsExpanded] = useState(!!reflection?.wasWorthIt !== null && reflection?.wasWorthIt !== undefined);

  useEffect(() => {
    setWasWorthIt(reflection?.wasWorthIt ?? null);
    setReason(reflection?.reason || '');
    setIsExpanded(reflection?.wasWorthIt !== null && reflection?.wasWorthIt !== undefined);
  }, [reflection]);

  const handleSelect = (worthIt: boolean) => {
    setWasWorthIt(worthIt);
    setIsExpanded(true);
    onSaveReflection(dateStr, { date: dateStr, wasWorthIt: worthIt, reason });
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newReason = e.target.value;
    setReason(newReason);
  };

  const handleReasonBlur = () => {
    if (wasWorthIt !== null) {
      onSaveReflection(dateStr, { date: dateStr, wasWorthIt, reason });
    }
  };

  return (
    <div className="w-full liquid-panel p-6 md:p-8 rounded-md border border-[#333] mb-4 flex flex-col items-center justify-center text-center transition-all duration-500">
      <h2 className="font-cinzel text-xl md:text-3xl text-white tracking-widest mb-6">Was today worth it?</h2>
      
      <div className="flex gap-4 mb-6 w-full max-w-sm justify-center">
        <button
          onClick={() => handleSelect(true)}
          className={`flex-1 py-3 font-mono uppercase tracking-widest text-xs transition-all duration-300 border ${
            wasWorthIt === true 
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
              : 'bg-[#111] border-[#333] text-[#aaaaaa] hover:border-emerald-500/50 hover:text-white'
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => handleSelect(false)}
          className={`flex-1 py-3 font-mono uppercase tracking-widest text-xs transition-all duration-300 border ${
            wasWorthIt === false 
              ? 'bg-red-500/20 border-red-500 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
              : 'bg-[#111] border-[#333] text-[#aaaaaa] hover:border-red-500/50 hover:text-white'
          }`}
        >
          No
        </button>
      </div>

      {isExpanded && (
        <div className="w-full max-w-2xl animate-fade-in flex flex-col items-center">
          <h3 className="font-serif text-white text-lg mb-3">Why?</h3>
          <textarea
            value={reason}
            onChange={handleReasonChange}
            onBlur={handleReasonBlur}
            placeholder="Write your thoughts freely..."
            className="w-full h-28 bg-[#111] border border-[#333] rounded-sm p-4 text-white font-sans text-sm focus:outline-none focus:border-[#555] custom-scrollbar resize-none transition-colors"
          />
          <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest mt-2 self-end">Saved automatically</span>
        </div>
      )}
    </div>
  );
}
