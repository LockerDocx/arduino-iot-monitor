'use client';

import { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
}

const chars = '!<>-_\\/[]{}—=+*^?#________';

export function GlitchText({ text, delay = 0, duration = 1500, className }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let frame: number;
    let start: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const ratio = Math.min(progress / duration, 1);
      
      const currentLength = Math.floor(ratio * text.length);
      let scrambled = '';
      
      for (let i = 0; i < text.length; i++) {
        if (i < currentLength) {
          scrambled += text[i];
        } else if (i < currentLength + 5) {
          scrambled += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      
      setDisplayText(scrambled);
      
      if (ratio < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setDisplayText(text);
      }
    };

    timeout = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [text, delay, duration]);

  return <span className={className}>{displayText}</span>;
}
