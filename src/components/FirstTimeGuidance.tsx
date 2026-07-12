
import { motion, AnimatePresence } from 'motion/react';

interface FirstTimeGuidanceProps {
  isVisible: boolean;
  title: string;
  what: string;
  why: string;
  benefit: string;
  onDismiss: () => void;
}

export default function FirstTimeGuidance({ isVisible, title, what, why, benefit, onDismiss }: FirstTimeGuidanceProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        >
          <div className="max-w-3xl w-full bg-[#0F0F11] border border-[#333333] p-6 md:p-12 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-cinzel text-xl sm:text-2xl md:text-3xl text-white tracking-widest uppercase mb-6 sm:mb-10 text-center">
              {title}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div>
                <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2 sm:mb-3">What It Does</h4>
                <p className="text-neutral-300 text-sm leading-relaxed">{what}</p>
              </div>
              <div>
                <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2 sm:mb-3">Why It Exists</h4>
                <p className="text-neutral-300 text-sm leading-relaxed">{why}</p>
              </div>
              <div>
                <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2 sm:mb-3">Benefit</h4>
                <p className="text-neutral-300 text-sm leading-relaxed">{benefit}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={onDismiss}
                className="text-white uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 transition-colors border border-[#333333] px-8 py-3 rounded-full hover:bg-white/10 hover:border-white/30 min-h-[44px]"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
