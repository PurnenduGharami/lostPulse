import { useState, useEffect, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';

interface DailyNoteOverlayProps {
  isOpen: boolean;
  notes: string[];
  activeNoteIndex: number | null;
  onClose: () => void;
  onSave: (newNotes: string[]) => void;
  onNavigate: (newIndex: number) => void;
}

export default function DailyNoteOverlay({ isOpen, notes, activeNoteIndex, onClose, onSave, onNavigate }: DailyNoteOverlayProps) {
  const { confirm } = useNotification();
  const [draft, setDraft] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Sync draft when active note changes
  useEffect(() => {
    if (activeNoteIndex !== null && activeNoteIndex < notes.length) {
      setDraft(notes[activeNoteIndex]);
    } else {
      setDraft('');
    }
    setIsDirty(false);
    
    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      // Move cursor to end
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 50);
  }, [activeNoteIndex, notes]);

  // Derived Title for Display
  const getDerivedTitle = (text: string) => {
    const lines = text.trim().split('\n');
    const firstLine = lines[0] || 'New Note';
    if (firstLine.length > 30) return firstLine.substring(0, 30) + '...';
    return firstLine;
  };

  const handleSaveAndSync = (currentDraft: string) => {
    const trimmed = currentDraft.trim();
    if (!trimmed && activeNoteIndex === null) {
      // Trying to save an empty new note, just do nothing
      return;
    }

    let newNotes = [...notes];
    
    if (activeNoteIndex !== null && activeNoteIndex < notes.length) {
      if (!trimmed) {
        // Edit to empty = delete
        newNotes.splice(activeNoteIndex, 1);
      } else {
        newNotes[activeNoteIndex] = trimmed;
      }
    } else {
      // New note
      if (trimmed) {
        // Add to beginning for "Newest first" ordering, or end? 
        // Instructions: "Newest first. or Manual ordering. Choose one."
        // We will do newest first.
        newNotes.unshift(trimmed);
      }
    }

    onSave(newNotes);
    setIsDirty(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    setIsDirty(true);
  };

  const handleClose = () => {
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    if (isDirty) {
      handleSaveAndSync(draft);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (activeNoteIndex !== null && activeNoteIndex < notes.length) {
      if (await confirm('Are you sure you want to delete this note?')) {
        if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
        const newNotes = [...notes];
        newNotes.splice(activeNoteIndex, 1);
        onSave(newNotes);
        setIsDirty(false);
        onClose();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, draft, isDirty]);

  if (!isOpen) return null;

  const isNew = activeNoteIndex === null || activeNoteIndex >= notes.length;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl h-[70vh] liquid-glass flex flex-col overflow-hidden shadow-2xl rounded-xl border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40 flex-shrink-0">
          <div className="font-serif text-white text-lg tracking-wide truncate pr-4">
            {getDerivedTitle(draft)}
          </div>
          <div className="flex items-center space-x-4">
            <span className={`font-mono text-xs ${draft.length >= 250 ? 'text-red-500' : 'text-neutral-500'}`}>
              {draft.length} / 250
            </span>
            <button onClick={handleClose} className="text-neutral-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-6 flex flex-col relative bg-transparent min-h-0">
          <textarea
            ref={textareaRef}
            className="w-full flex-1 bg-transparent text-white font-mono text-sm leading-relaxed resize-none outline-none placeholder:text-neutral-600"
            placeholder="Type your daily note here... (Max 250 characters)"
            maxLength={250}
            value={draft}
            onChange={handleChange}
            autoFocus
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-2">
            {!isNew && (
              <button 
                onClick={handleDelete}
                className="text-xs font-mono px-3 py-1.5 liquid-button border-red-900/30 text-red-500 hover:bg-red-900/20"
              >
                Delete
              </button>
            )}
            <span className="text-[10px] text-neutral-600 font-mono hidden md:inline ml-4">Ctrl+Enter to save & close • Esc to close</span>
          </div>

          <div className="flex space-x-3">
            {!isNew && (
              <>
                <button
                  disabled={activeNoteIndex === 0}
                  onClick={() => {
                    if (isDirty) handleSaveAndSync(draft);
                    onNavigate((activeNoteIndex || 0) - 1);
                  }}
                  className="px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  &larr; Prev
                </button>
                <button
                  disabled={activeNoteIndex === notes.length - 1}
                  onClick={() => {
                    if (isDirty) handleSaveAndSync(draft);
                    onNavigate((activeNoteIndex || 0) + 1);
                  }}
                  className="px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  Next &rarr;
                </button>
              </>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-1.5 liquid-button text-xs font-mono text-white"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
