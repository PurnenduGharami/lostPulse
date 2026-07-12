import React, { useState } from 'react';
import LiquidNumberInput from './LiquidNumberInput';
import type { UserProfile } from '../types';
import { motion } from 'motion/react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [targetLifespan, setTargetLifespan] = useState('80');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && birthDate && targetLifespan) {
      onComplete({
        name,
        birthDate,
        targetLifespan: parseInt(targetLifespan, 10),
        createdAt: Date.now(),
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="liquid-glass p-6 sm:p-8 rounded-lg max-w-md w-full space-y-6">
        <h1 className="font-serif text-2xl sm:text-3xl text-center">Initialize Sequence</h1>
        <p className="text-xs sm:text-sm text-white text-center font-sans">
          Establish your biological baseline to calibrate the countdown.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white">Designation (Name)</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111111] border border-[#333333] focus:border-red-500 rounded-md py-2.5 px-4 outline-none font-sans text-sm min-h-[44px]"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white">Origin (Birth Date)</label>
            <input 
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-[#111111] border border-[#333333] focus:border-red-500 rounded-md py-2.5 px-4 outline-none font-sans text-sm min-h-[44px]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white">Expected Capacity (Years)</label>
            <div className="h-[44px]">
              <LiquidNumberInput 
                min={1}
                max={120}
                value={targetLifespan}
                onChange={(val) => setTargetLifespan(val.toString())}
                className="w-full bg-transparent text-white text-sm px-4 outline-none font-sans"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#8B0000] hover:bg-[#ff2222] text-white uppercase tracking-widest text-sm py-3 rounded-md transition-colors duration-300 font-bold min-h-[44px]"
          >
            Commence Tracking
          </button>
        </form>
      </div>
    </motion.div>
  );
}
