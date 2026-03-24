'use client';

import { useEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { useUIStore } from '@/store/use-ui-store';
import { clsx } from 'clsx';

export function CustomCursor() {
  const cursorState = useUIStore((state) => state.cursorState);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className={clsx(
        'fixed top-0 left-0 pointer-events-none z-50 flex items-center justify-center rounded-full mix-blend-screen transition-[width,height,background-color,border-color,margin] duration-300',
        cursorState === 'default' && 'w-0 h-0 opacity-0',
        cursorState === 'thermal' && 'w-24 h-24 bg-thermal/40 backdrop-blur-sm border border-thermal/50 -ml-12 -mt-12',
        cursorState === 'liquid' && 'w-24 h-24 bg-liquid/40 backdrop-blur-sm border border-liquid/50 -ml-12 -mt-12'
      )}
      style={{
        x: cursorX,
        y: cursorY,
      }}
    >
      {cursorState === 'thermal' && (
        <span className="text-[10px] font-mono font-bold tracking-widest text-white">THERMAL</span>
      )}
      {cursorState === 'liquid' && (
        <span className="text-[10px] font-mono font-bold tracking-widest text-white">LIQUID</span>
      )}
    </motion.div>
  );
}
