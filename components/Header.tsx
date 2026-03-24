'use client';

import { GlitchText } from './GlitchText';
import { motion } from 'motion/react';
import { useUIStore } from '@/store/use-ui-store';
import { Maximize } from 'lucide-react';

export function Header() {
  const { toggleFullscreen } = useUIStore();

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-40 flex justify-between items-start p-6 md:p-12 mix-blend-difference"
      initial={{ clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)' }}
      animate={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
      transition={{ duration: 1.5, delay: 1.5, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tighter text-white">
          <GlitchText text="IGLOO INC." delay={1500} duration={1000} />
        </h1>
        <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase">
          <GlitchText text="ENVIRONMENTAL TELEMETRY" delay={2000} duration={1200} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleFullscreen}
            className="text-white/50 hover:text-white transition-colors"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
