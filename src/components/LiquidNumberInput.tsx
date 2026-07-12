import React from 'react';

interface LiquidNumberInputProps {
  value: number | string;
  onChange: (val: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  onBlur?: (val: number | string) => void;
}

export default function LiquidNumberInput({ 
  value, 
  onChange, 
  min = 0, 
  max = 999999, 
  step = 1, 
  className = "w-10",
  placeholder,
  onBlur
}: LiquidNumberInputProps) {
  const handleUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const curr = typeof value === 'number' ? value : (parseInt(value, 10) || min);
    onChange(Math.min(max, curr + step));
  };

  const handleDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const curr = typeof value === 'number' ? value : (parseInt(value, 10) || min);
    onChange(Math.max(min, curr - step));
  };

  return (
    <div className="flex items-center bg-black/50 rounded-sm border border-white/5 relative">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          if (e.target.value === '') {
            onChange('');
          } else {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) {
              onChange(val);
            }
          }
        }}
        onBlur={(e) => {
           if (e.target.value === '') {
             if (onBlur) onBlur('');
             return;
           }
           let val = parseInt(e.target.value, 10);
           if (isNaN(val)) val = min;
           val = Math.max(min, Math.min(max, val));
           onChange(val);
           if (onBlur) onBlur(val);
        }}
        className={`${className} bg-transparent text-white text-center font-mono text-sm focus:outline-none focus:text-red-400 transition-colors appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none m-0 py-1`}
        min={min}
        max={max}
        placeholder={placeholder}
      />
      <div className="flex flex-col border-l border-white/5 px-1 bg-black/20 justify-center">
        <button 
          type="button"
          aria-label="Increase value"
          onClick={handleUp} 
          className="text-[#555555] hover:text-white transition-colors leading-[8px] text-[8px] pb-[1px]"
        >
          ▲
        </button>
        <button 
          type="button"
          aria-label="Decrease value"
          onClick={handleDown} 
          className="text-[#555555] hover:text-white transition-colors leading-[8px] text-[8px] pt-[1px]"
        >
          ▼
        </button>
      </div>
    </div>
  );
}
