import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreHorizontal } from 'lucide-react';

export type WorkspaceType = 'tracker' | 'planner' | 'report' | 'analytics' | 'settings';

import type { ProgressionState } from '../types';

interface FloatingNavProps {
  activeWorkspace: WorkspaceType;
  onSelectWorkspace: (workspace: WorkspaceType) => void;
  isVisible?: boolean;
  progressionState?: ProgressionState;
}

export default function FloatingNav({ activeWorkspace, onSelectWorkspace, isVisible = true, progressionState }: FloatingNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const workspaces = [
    { id: 'tracker' as WorkspaceType, label: 'KRONOS RECORD' },
    ...(progressionState?.blueprintUnlocked ? [{ id: 'planner' as WorkspaceType, label: 'KRONOS BLUEPRINT' }] : []),
    ...(progressionState?.epilogueUnlocked ? [{ id: 'report' as WorkspaceType, label: 'EPILOGUE' }] : []),
    ...(progressionState?.chronicleUnlocked ? [{ id: 'analytics' as WorkspaceType, label: 'CHRONICLE' }] : []),
    { id: 'settings' as WorkspaceType, label: 'SETTINGS' },
  ];

  useEffect(() => {
    if (!isVisible && isOpen) {
      setIsOpen(false);
    }
  }, [isVisible, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen && 
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-[60] w-12 h-12 bg-black/50 backdrop-blur-md rounded-full border border-[#333333] flex items-center justify-center text-[#888] hover:text-white hover:border-white/30 hover:bg-black/80 hover:scale-[1.01] transition-all duration-300 shadow-2xl group ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <MoreHorizontal className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 sm:left-6 sm:translate-x-0 z-[70] pointer-events-none">
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto liquid-glass rounded-2xl p-2 w-64 max-w-[calc(100vw-32px)] border border-[#333333] shadow-2xl flex flex-col gap-1 origin-bottom sm:origin-bottom-left"
            >
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    onSelectWorkspace(workspace.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 uppercase tracking-widest text-xs font-cinzel ${
                    activeWorkspace === workspace.id
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {workspace.label}
                </button>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
