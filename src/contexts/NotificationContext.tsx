import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

type NotificationMode = 'alert' | 'confirm';

interface NotificationState {
  isOpen: boolean;
  mode: NotificationMode;
  message: string;
}

interface NotificationContextType {
  alert: (message: string) => void;
  confirm: (message: string) => Promise<boolean>;
  toast: (message: string, onUndo?: () => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NotificationState>({
    isOpen: false,
    mode: 'alert',
    message: ''
  });
  
  const [resolveFn, setResolveFn] = useState<((value: boolean) => void) | null>(null);

  const alert = useCallback((message: string) => {
    setState({ isOpen: true, mode: 'alert', message });
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, mode: 'confirm', message });
      setResolveFn(() => resolve);
    });
  }, []);

  const [toasts, setToasts] = useState<{id: string, message: string, onUndo?: () => void}[]>([]);

  const toast = useCallback((message: string, onUndo?: () => void) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, onUndo }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000); // 5-second toast
  }, []);

  const handleClose = (result: boolean) => {
    setState(prev => ({ ...prev, isOpen: false }));
    if (resolveFn) {
      resolveFn(result);
      setResolveFn(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ alert, confirm, toast }}>
      {children}
      
      {state.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => handleClose(false)}></div>
          <div className="relative w-full max-w-sm liquid-panel p-6 rounded-md text-center shadow-2xl border border-[#333333]">
            <p className="text-white font-mono text-sm mb-8 tracking-wide">
              {state.message}
            </p>
            
            <div className="flex space-x-4">
              {state.mode === 'confirm' ? (
                <>
                  <button 
                    onClick={() => handleClose(true)}
                    className="flex-1 py-2 liquid-button text-white hover:text-red-400 font-mono text-xs tracking-widest uppercase transition-colors"
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => handleClose(false)}
                    className="flex-1 py-2 liquid-button text-white font-mono text-xs tracking-widest uppercase transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleClose(true)}
                  className="w-full py-2 liquid-button text-white hover:text-red-400 font-mono text-xs tracking-widest uppercase transition-colors"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="liquid-panel px-4 py-3 rounded border border-[#333] shadow-lg flex items-center gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <span className="text-[#ccc] font-mono text-xs tracking-wide">{t.message}</span>
            {t.onUndo && (
              <button 
                onClick={() => {
                  t.onUndo!();
                  setToasts(prev => prev.filter(item => item.id !== t.id));
                }}
                className="text-red-400 hover:text-red-300 font-mono text-xs uppercase tracking-widest border border-red-500/30 px-2 py-1 rounded bg-red-500/10 transition-colors"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
