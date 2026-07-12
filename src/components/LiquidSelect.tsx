import { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface LiquidSelectProps {
  value: string | number;
  onChange: (val: string | number) => void;
  options: SelectOption[];
  className?: string;
  listClassName?: string;
  buttonClassName?: string;
}

export default function LiquidSelect({ value, onChange, options, className = '', listClassName = '', buttonClassName = 'text-xs px-3 py-2' }: LiquidSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`liquid-input flex items-center justify-between text-white outline-none font-mono tracking-widest cursor-pointer w-full focus:ring-2 focus:ring-white transition-all uppercase ${buttonClassName}`}
      >
        <span className="truncate mr-2">{selectedOption?.label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`flex-shrink-0 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div role="listbox" className={`absolute top-full left-0 mt-1 z-[3000] liquid-glass border border-[#333333] shadow-2xl py-1 min-w-full max-h-60 overflow-y-auto ${listClassName}`}>
          {options.map((opt) => (
            <button
              type="button"
              role="option"
              aria-selected={value === opt.value}
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${value === opt.value ? 'bg-red-500 text-white font-bold' : 'text-[#aaaaaa] hover:bg-white/10 hover:text-white'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
