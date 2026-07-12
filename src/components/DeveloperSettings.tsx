import { useState } from 'react';
import LiquidNumberInput from './LiquidNumberInput';
import { useNotification } from '../contexts/NotificationContext';

interface DeveloperSettingsProps {
  onInjectHours: (dateStr: string, hours: number, title: string) => void;
  onResetData: () => void;
}

export default function DeveloperSettings({ onInjectHours, onResetData }: DeveloperSettingsProps) {
  const { confirm } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [injectDate, setInjectDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [injectHours, setInjectHours] = useState(12);
  const [injectTitle, setInjectTitle] = useState('Dummy Time');
  const [isBypassEnabled, setIsBypassEnabled] = useState(() => localStorage.getItem('dev_time_bypass') === 'true');

  const toggleBypass = () => {
    const newVal = !isBypassEnabled;
    setIsBypassEnabled(newVal);
    localStorage.setItem('dev_time_bypass', newVal.toString());
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 z-[100] p-2 text-white hover:text-white transition-colors duration-300"
        title="Developer Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f0f11]/85 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-full max-w-md liquid-glass p-8 border border-[#333333] rounded-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-mono text-xl text-red-500 font-bold uppercase tracking-widest">Super User Tools</h2>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-[#111111] border border-[#333333] rounded-sm">
                <h3 className="text-white font-serif mb-2">Time Manipulation</h3>
                <p className="text-xs text-white font-sans mb-4">
                  Precisely inject dummy time blocks to bypass feature locks without waiting.
                </p>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs text-white font-mono mb-1">Date</label>
                    <input 
                      type="date" 
                      value={injectDate}
                      onChange={(e) => setInjectDate(e.target.value)}
                      className="w-full bg-[#111111] border border-[#333333] text-white text-sm px-2 py-1 outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white font-mono mb-1">Hours</label>
                    <LiquidNumberInput 
                      min={1} 
                      max={24}
                      value={injectHours}
                      onChange={(val) => setInjectHours(typeof val === 'number' ? val : 1)}
                      className="w-full bg-transparent text-white text-sm px-2 py-1 outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white font-mono mb-1">Title</label>
                    <input 
                      type="text" 
                      value={injectTitle}
                      onChange={(e) => setInjectTitle(e.target.value)}
                      className="w-full bg-[#111111] border border-[#333333] text-white text-sm px-2 py-1 outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => {
                    onInjectHours(injectDate, injectHours, injectTitle);
                    setIsOpen(false);
                  }}
                  className="w-full py-2 bg-[#333333] hover:bg-[#555555] text-white font-mono text-xs tracking-widest uppercase transition-colors duration-200 border border-[#444444]"
                >
                  Inject Data
                </button>
              </div>

              <div className="p-4 bg-[#111111] border border-[#333333] rounded-sm">
                <h3 className="text-white font-serif mb-2">Time Constraints</h3>
                <p className="text-xs text-white font-sans mb-4">
                  Bypass the "Cannot plan in the past" restrictions for testing the Planner.
                </p>
                <button 
                  onClick={toggleBypass}
                  className={`w-full py-2 font-mono text-xs tracking-widest uppercase transition-colors duration-200 border ${isBypassEnabled ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30' : 'bg-[#333333] hover:bg-[#555555] text-white border-[#444444]'}`}
                >
                  {isBypassEnabled ? 'Bypass Enabled' : 'Bypass Disabled'}
                </button>
              </div>

              <div className="p-4 bg-[#111111] border border-[#333333] rounded-sm">
                <h3 className="text-red-400 font-serif mb-2">Danger Zone</h3>
                <p className="text-xs text-white font-sans mb-4">
                  Wipe all localStorage data and return to the onboarding sequence.
                </p>
                <button 
                  onClick={async () => {
                    if (await confirm("Are you sure you want to nuke all data?")) {
                      onResetData();
                    }
                  }}
                  className="w-full py-2 bg-red-950 hover:bg-red-900 text-red-500 font-mono text-xs tracking-widest uppercase transition-colors duration-200 border border-red-900"
                >
                  Nuke Local Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
