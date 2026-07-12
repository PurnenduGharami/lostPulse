interface LockedFeatureProps {
  title: string;
  description: string;
  progress: number; // 0 to 1
  progressText: string;
}

export default function LockedFeature({ title, description, progress, progressText }: LockedFeatureProps) {
  return (
    <div className="relative w-full h-[100vh] max-w-none p-12 liquid-glass flex flex-col items-center justify-center text-center overflow-hidden rounded-none border-none">
      
      <div className="z-10 flex flex-col items-center space-y-6 max-w-lg">
        <div className="w-16 h-16 rounded-full border border-[#333333] flex items-center justify-center mb-2">
          {/* Simple Lock Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        
        <h3 className="font-serif text-2xl text-white font-bold drop-shadow-md">{title}</h3>
        <p className="font-sans text-sm text-white drop-shadow-sm font-medium">{description}</p>
        
        <div className="w-full pt-6">
          <div className="flex justify-between font-mono text-xs text-neutral-100 font-bold drop-shadow-sm mb-2 uppercase tracking-widest">
            <span>Progress</span>
            <span>{progressText}</span>
          </div>
          <div className="w-full h-1.5 liquid-input rounded-full overflow-hidden border-none shadow-inner">
            <div 
              className="h-full bg-[#8B0000] transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
