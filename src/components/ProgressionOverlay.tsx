import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { CinematicNotification } from '../types';
import { Check } from 'lucide-react';

interface ProgressionOverlayProps {
  notifications: CinematicNotification[];
  onDismiss: (id: string) => void;
}

export default function ProgressionOverlay({ notifications, onDismiss }: ProgressionOverlayProps) {
  const [current, setCurrent] = useState<CinematicNotification | null>(null);

  useEffect(() => {
    if (!current && notifications.length > 0) {
      setCurrent(notifications[0]);
    } else if (current && !notifications.find(n => n.id === current.id)) {
      if (notifications.length > 0) {
        setCurrent(notifications[0]);
      } else {
        setCurrent(null);
      }
    }
  }, [notifications, current]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-8 select-none"
        >
          <div className="max-w-2xl w-full flex flex-col items-center relative">
            
            {/* 1. Small label */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="mb-4 text-neutral-400 tracking-[0.3em] text-sm uppercase font-medium text-center"
            >
              {current.type === 'day_complete' ? 'DAY COMPLETE' : (current.subtitle || 'SYSTEM UNLOCKED')}
            </motion.div>

            {/* 2 & 3. Feature title & Red Glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
              className="relative text-3xl xs:text-4xl md:text-6xl font-cinzel text-white tracking-[0.1em] text-center drop-shadow-2xl whitespace-nowrap"
            >
              {current.type !== 'day_complete' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 2 }}
                  className="absolute inset-0 bg-red-500/10 blur-[80px] rounded-full scale-150"
                />
              )}
              <h1 className="relative">
                {current.type === 'day_complete' ? (
                  current.title
                ) : (
                  current.title.split(' ').map((word, i, arr) => (
                    <React.Fragment key={i}>
                      {i > 0 && ' '}
                      <span className={i > 0 || arr.length === 1 ? "text-red-500" : ""}>{word}</span>
                    </React.Fragment>
                  ))
                )}
              </h1>
            </motion.div>

            {/* Subtitle for day complete */}
            {current.type === 'day_complete' && current.subtitle && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="text-base md:text-xl text-neutral-300 mb-6 md:mb-8 font-cinzel tracking-wider text-center"
              >
                {current.subtitle}
              </motion.div>
            )}

            {/* 4. Very short description */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className={`text-sm sm:text-base md:text-lg lg:text-xl text-neutral-300 leading-relaxed text-center whitespace-pre-wrap font-light tracking-wide ${current.purpose || current.reward ? 'mb-6 md:mb-12' : 'mb-8 md:mb-16'}`}
            >
              {current.description}
            </motion.div>

            {/* 5. Unlock card */}
            {(current.purpose || current.reward) && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 1, ease: "easeOut" }}
                className="w-full max-w-md liquid-glass border border-[#333333] rounded-xl p-4 sm:p-6 mb-6 md:mb-12 shadow-2xl relative overflow-hidden"
              >
                <div className="flex flex-col gap-4 sm:gap-6">
                  {current.purpose && (
                    <div>
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1">Purpose</div>
                      <div className="text-xs sm:text-sm text-neutral-200">{current.purpose}</div>
                    </div>
                  )}
                  {current.reward && (
                    <div>
                      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1 flex items-center justify-between">
                        <span>Status</span>
                        <span className="text-white flex items-center gap-1 font-medium tracking-widest"><Check className="w-3 h-3 text-red-500"/> UNLOCKED</span>
                      </div>
                      <div className="text-xs sm:text-sm text-neutral-200">{current.reward}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 6. Primary button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 1 }}
              onClick={() => {
                if (current.onAction) current.onAction();
                if (current.onDismiss) current.onDismiss();
                onDismiss(current.id);
              }}
              className="text-white uppercase tracking-[0.2em] text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 border border-[#333333] hover:border-red-500/50 bg-black/50 px-6 sm:px-10 py-3 sm:py-4 rounded-full hover:bg-black/80 hover:scale-[1.02] shadow-lg min-h-[44px]"
            >
              {current.actionText || 'CONTINUE'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
