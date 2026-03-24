'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/store/use-ui-store';

const bootLines = [
  '[SYS] INITIALIZING KERNEL...',
  '[SYS] MOUNTING VIRTUAL DOM...',
  '[NET] ESTABLISHING WEBSOCKET CONNECTION...',
  '[NET] PORT: COM5 OPEN',
  '[HW] SENSOR DHT11 DETECTED',
  '[HW] CALIBRATING THERMAL SENSORS... OK',
  '[HW] CALIBRATING HUMIDITY SENSORS... OK',
  '[SYS] BOOT SEQUENCE COMPLETE.',
];

export function BootSequence() {
  const { isBooting, setBooting } = useUIStore();
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!isBooting) return;

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootLines.length) {
        setLines((prev) => [...prev, bootLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBooting(false), 800);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isBooting, setBooting]);

  return (
    <AnimatePresence>
      {isBooting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] bg-abyssal flex flex-col justify-end p-8 font-mono text-xs text-liquid"
        >
          <div className="max-w-2xl w-full">
            {lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-1"
              >
                {line}
              </motion.div>
            ))}
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="w-2 h-3 bg-liquid mt-2 inline-block"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
