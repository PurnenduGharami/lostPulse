import { useState } from 'react';
import LiquidSelect from './LiquidSelect';

export default function SettingsData() {
  const [exportFormat, setExportFormat] = useState('json');
  const [exportScope, setExportScope] = useState('everything');
  
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    let dataToExport: any = { version: '1.0.0' };
    
    if (exportScope === 'everything' || exportScope === 'tracker') {
      dataToExport.timeBlocks = JSON.parse(localStorage.getItem('timeBlocks') || '{}');
      dataToExport.categories = JSON.parse(localStorage.getItem('categories') || '[]');
    }
    if (exportScope === 'everything' || exportScope === 'planner') {
      dataToExport.plannedBlocks = JSON.parse(localStorage.getItem('plannedBlocks') || '{}');
    }
    if (exportScope === 'everything' || exportScope === 'reports') {
      dataToExport.dailyNotes = JSON.parse(localStorage.getItem('dailyNotes') || '{}');
      dataToExport.plannedDailyNotes = JSON.parse(localStorage.getItem('plannedDailyNotes') || '{}');
      dataToExport.dailyReflections = JSON.parse(localStorage.getItem('dailyReflections') || '{}');
    }
    if (exportScope === 'everything') {
      dataToExport.userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      dataToExport.goals = JSON.parse(localStorage.getItem('goals') || '{}');
    }

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lostpulse_${exportScope}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`Exporting to ${exportFormat.toUpperCase()} is not fully implemented yet.`);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (typeof data !== 'object' || data === null) throw new Error("Invalid format.");
        
        if (data.timeBlocks && typeof data.timeBlocks === 'object') {
           localStorage.setItem('timeBlocks', JSON.stringify(data.timeBlocks));
        }
        if (data.plannedBlocks && typeof data.plannedBlocks === 'object') {
           localStorage.setItem('plannedBlocks', JSON.stringify(data.plannedBlocks));
        }
        if (data.categories && Array.isArray(data.categories)) {
           localStorage.setItem('categories', JSON.stringify(data.categories));
        }
        if (data.dailyNotes && typeof data.dailyNotes === 'object') {
           localStorage.setItem('dailyNotes', JSON.stringify(data.dailyNotes));
        }
        if (data.plannedDailyNotes && typeof data.plannedDailyNotes === 'object') {
           localStorage.setItem('plannedDailyNotes', JSON.stringify(data.plannedDailyNotes));
        }
        if (data.dailyReflections && typeof data.dailyReflections === 'object') {
           localStorage.setItem('dailyReflections', JSON.stringify(data.dailyReflections));
        }
        if (data.userProfile && typeof data.userProfile === 'object') {
           localStorage.setItem('userProfile', JSON.stringify(data.userProfile));
        }
        if (data.goals && typeof data.goals === 'object') {
           localStorage.setItem('goals', JSON.stringify(data.goals));
        }
        
        alert('Import successful! The application will now reload.');
        window.location.reload();
      } catch (err: any) {
        alert('Failed to import: ' + err.message);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (showResetConfirm) {
      localStorage.clear();
      window.location.reload();
    } else {
      setShowResetConfirm(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="mb-8 border-b border-[#333] pb-6">
        <h2 className="font-cinzel text-2xl text-white tracking-widest uppercase mb-2">Data Management</h2>
        <p className="font-mono text-xs text-[#888] uppercase tracking-widest">
          Control your personal data. Everything is stored locally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Section */}
        <section className="liquid-panel p-6 rounded-md border border-[#222]">
          <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Export & Backup</h3>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-[#888] uppercase">Export Scope</label>
              <LiquidSelect 
                value={exportScope}
                onChange={(v) => setExportScope(v as string)}
                options={[
                  { value: 'everything', label: 'Everything (Full Backup)' },
                  { value: 'tracker', label: 'Time Tracker Only' },
                  { value: 'planner', label: 'Time Planner Only' },
                  { value: 'reports', label: 'Daily Reports & Notes' }
                ]}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs text-[#888] uppercase">Format</label>
              <LiquidSelect 
                value={exportFormat}
                onChange={(v) => setExportFormat(v as string)}
                options={[
                  { value: 'json', label: 'JSON (Machine Readable)' },
                  { value: 'csv', label: 'CSV (Spreadsheet)' },
                  { value: 'md', label: 'Markdown (Human Readable)' }
                ]}
              />
            </div>

            <div className="pt-4 flex justify-between items-center">
              <span className="font-mono text-[10px] text-[#555] uppercase tracking-widest">Est. Size: ~245 KB</span>
              <button 
                onClick={handleExport}
                className="px-4 py-2 bg-white/10 hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-widest transition-colors rounded-sm border border-white/20 hover:border-white flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export Data
              </button>
            </div>
          </div>
        </section>

        {/* Import Section */}
        <section className="liquid-panel p-6 rounded-md border border-[#222]">
          <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Import & Restore</h3>
          
          <div className="space-y-6">
            <p className="font-mono text-xs text-[#888] leading-relaxed">
              Restore a previous backup or import data from another device. 
              Importing a full backup will overwrite existing matching records.
            </p>

            <div className="pt-4 border-t border-[#333]/50">
              <button 
                onClick={handleImport}
                className="w-full px-4 py-3 bg-[#111] hover:bg-[#222] text-[#ccc] hover:text-white font-mono text-xs uppercase tracking-widest transition-colors rounded-sm border border-[#333] hover:border-[#666] flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Select File to Import
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="md:col-span-2 liquid-panel p-6 rounded-md border border-red-500/20 bg-red-500/5">
          <h3 className="font-mono text-sm text-red-400 uppercase tracking-widest mb-6 border-b border-red-500/20 pb-2 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Danger Zone
          </h3>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h4 className="font-serif text-lg text-white mb-1">Factory Reset</h4>
              <p className="font-mono text-xs text-[#888]">
                Permanently delete all trackers, goals, configurations, and notes from this device. <strong>This cannot be undone.</strong>
              </p>
            </div>
            <button 
              onClick={handleReset}
              className={`px-6 py-3 font-mono text-xs uppercase tracking-widest transition-all rounded-sm border flex-shrink-0 ${showResetConfirm ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-transparent text-red-400 border-red-500/50 hover:bg-red-500/10'}`}
            >
              {showResetConfirm ? 'Click again to confirm' : 'Delete All Data'}
            </button>
          </div>
        </section>

        {/* Local Network Sync (Upcoming) */}
        <section className="md:col-span-2 liquid-panel p-6 rounded-md border border-[#222]">
          <h3 className="font-mono text-sm text-[#aaaaaa] uppercase tracking-widest mb-6 border-b border-[#333] pb-2 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>
            Local Network Sync (Coming Soon)
          </h3>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-50 pointer-events-none">
            <div>
              <h4 className="font-serif text-lg text-white mb-1">Sync Across Devices</h4>
              <p className="font-mono text-xs text-[#888]">
                Seamlessly synchronize your data between devices on the same local network without cloud storage.
              </p>
            </div>
            <button 
              disabled
              className="px-6 py-3 font-mono text-xs uppercase tracking-widest transition-all rounded-sm border bg-transparent text-[#555] border-[#333] cursor-not-allowed"
            >
              Configure Sync
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
