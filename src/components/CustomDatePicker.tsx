import { useState, useEffect, useRef } from 'react';
import LiquidSelect from './LiquidSelect';

interface CustomDatePickerProps {
  currentDate: string;
  onChange: (dateStr: string) => void;
  maxDate?: string;
  minDate?: string;
  dailyNotes?: Record<string, string[]>;
  customLabel?: React.ReactNode;
  className?: string;
}

export default function CustomDatePicker({ currentDate, onChange, maxDate, minDate, dailyNotes, customLabel, className }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const [y, m, d] = currentDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthChange = (offset: number) => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + offset);
      return d;
    });
  };

  const handleDirectMonthChange = (newMonth: number) => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(newMonth);
      return d;
    });
  };

  const handleDirectYearChange = (newYear: number) => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setFullYear(newYear);
      return d;
    });
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const handleSelectDate = (y: number, m: number, d: number) => {
    const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`;
    if (maxDate && dateStr > maxDate) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  // Generate calendar days
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={className || "bg-transparent border border-neutral-700 hover:border-white text-red-500 hover:text-white font-mono text-sm font-bold tracking-wider px-3 py-1 outline-none transition-colors rounded-none flex items-center space-x-2"}
      >
        {customLabel ? customLabel : <span>{currentDate}</span>}
        {!customLabel && dailyNotes && dailyNotes[currentDate] && dailyNotes[currentDate].length > 0 && (
          <span className="w-1.5 h-1.5 bg-current rounded-full transition-colors"></span>
        )}
        {!customLabel && <span>▾</span>}
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-[2000] w-[300px] liquid-glass border border-red-900/50 p-4 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => handleMonthChange(-1)} className="text-neutral-500 hover:text-white transition-colors px-2">&lt;</button>
            <div className="flex space-x-1">
              <LiquidSelect
                value={month}
                onChange={(val) => handleDirectMonthChange(Number(val))}
                options={monthNames.map((m, idx) => ({ value: idx, label: m }))}
                className="w-28"
                listClassName="-left-4 min-w-[140px]"
              />
              <LiquidSelect
                value={year}
                onChange={(val) => handleDirectYearChange(Number(val))}
                options={Array.from({ length: 21 }, (_, i) => {
                  const y = new Date().getFullYear() - 5 + i; // -5 years to +15 years
                  return { value: y, label: y.toString() };
                })}
                className="w-24"
              />
            </div>
            <button onClick={() => handleMonthChange(1)} className="text-neutral-500 hover:text-white transition-colors px-2">&gt;</button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-[10px] font-mono text-neutral-500">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const isSelected = dateStr === currentDate;
              const isFuture = maxDate ? dateStr > maxDate : false;
              const isPast = minDate ? dateStr < minDate : false;
              const isDisabled = isFuture || isPast;
              
              return (
                <button
                  key={day}
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(year, month, day)}
                  className={`
                    w-full aspect-square flex items-center justify-center font-mono text-xs
                    ${isDisabled ? 'opacity-30 cursor-not-allowed text-neutral-500' : 'hover:bg-red-900/50 cursor-pointer'}
                    ${isSelected ? 'bg-red-500 text-white font-bold' : 'text-neutral-300'}
                  `}
                >
                  <div className="relative">
                    {day}
                    {dailyNotes && dailyNotes[dateStr] && dailyNotes[dateStr].length > 0 && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
