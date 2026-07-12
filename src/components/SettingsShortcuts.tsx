export default function SettingsShortcuts() {
  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="mb-8 border-b border-[#333] pb-6 flex justify-between items-end">
        <div>
          <h2 className="font-cinzel text-2xl text-white tracking-widest uppercase mb-2">Shortcuts Guide</h2>
          <p className="font-mono text-xs text-[#888] uppercase tracking-widest">
            Power user commands for rapid interaction.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="liquid-panel p-6 rounded-md border border-[#222]">
          <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Global Keyboard Shortcuts</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">New Entry</span>
              <kbd className="px-2 py-1 bg-[#222] text-white rounded font-mono text-xs border border-[#444]">N</kbd>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Toggle Timer</span>
              <kbd className="px-2 py-1 bg-[#222] text-white rounded font-mono text-xs border border-[#444]">Space</kbd>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Delete Selected Block</span>
              <kbd className="px-2 py-1 bg-[#222] text-white rounded font-mono text-xs border border-[#444]">Delete</kbd>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Search Settings</span>
              <kbd className="px-2 py-1 bg-[#222] text-white rounded font-mono text-xs border border-[#444]">Ctrl + K</kbd>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Close Modal</span>
              <kbd className="px-2 py-1 bg-[#222] text-white rounded font-mono text-xs border border-[#444]">Esc</kbd>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Undo Change</span>
              <kbd className="px-2 py-1 bg-[#222] text-white rounded font-mono text-xs border border-[#444]">Ctrl + Z</kbd>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Redo Change</span>
              <kbd className="px-2 py-1 bg-[#222] text-white rounded font-mono text-xs border border-[#444]">Ctrl + Y / Ctrl+Shift+Z</kbd>
            </div>
          </div>
        </section>

        <section className="liquid-panel p-6 rounded-md border border-[#222]">
          <h3 className="font-mono text-sm text-white uppercase tracking-widest mb-6 border-b border-[#333] pb-2">Mouse Interactions</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Create Block</span>
              <span className="font-mono text-xs text-white">Click & Drag on Grid</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Edit Block</span>
              <span className="font-mono text-xs text-white">Double Click Block</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[#222] pb-2">
              <span className="font-mono text-sm text-[#888] uppercase">Context Menu</span>
              <span className="font-mono text-xs text-white">Right Click Block</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
