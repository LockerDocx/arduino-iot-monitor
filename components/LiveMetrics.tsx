'use client';

import { useSensorData } from '@/hooks/use-sensor-data';
import { useUIStore } from '@/store/use-ui-store';
import { motion, AnimatePresence } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { Maximize2, Bell as Siren, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import emailjs from '@emailjs/browser';

export function LiveMetrics() {
  const { data, history } = useSensorData();
  const { setCursorState, isFullscreen, setExpandedMetric } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const lastEmailSentRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  // Siren Logic
  useEffect(() => {
    const isAlert = data && (data.temperature > 28 || data.temperature < 15 || data.humidity > 78);

    if (isAlert && isAudioEnabled) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (!oscillatorRef.current) {
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        
        // Siren effect: frequency modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 2; // 2Hz siren
        lfoGain.gain.value = 100;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        gain.gain.value = 0.1;
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        lfo.start();
        oscillatorRef.current = osc;
      }
    } else {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
    }

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
    };
  }, [data, isAudioEnabled]);

  // Email Alert Logic
  useEffect(() => {
    if (!data) return;

    const tempThresholdHigh = 28;
    const tempThresholdLow = 15;
    const humThreshold = 78;
    const cooldown = 1000 * 60 * 30; // 30 minutes cooldown between emails
    const now = Date.now();

    const isTempAlert = data.temperature > tempThresholdHigh || data.temperature < tempThresholdLow;
    const isHumAlert = data.humidity > humThreshold;

    if ((isTempAlert || isHumAlert) && (now - lastEmailSentRef.current) > cooldown) {
      const sendEmailAlert = async () => {
        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
          console.warn('EmailJS keys missing. Please configure them in the Settings menu.');
          return;
        }

        let problem = '';
        if (data.temperature > tempThresholdHigh) problem = 'Temperatura Excesiva (> 28°C)';
        else if (data.temperature < tempThresholdLow) problem = 'Temperatura Crítica Baja (< 15°C)';
        
        if (data.humidity > humThreshold) {
          problem = problem ? `${problem} & Humedad Crítica (> 78%)` : 'Humedad Crítica (> 78%)';
        }

        try {
          await emailjs.send(
            serviceId,
            templateId,
            {
              to_email: 'gerardmp2008@gmail.com',
              subject: '🚨 ALERTA CRÍTICA CPD',
              temperature: data.temperature.toFixed(1),
              humidity: data.humidity.toFixed(1),
              timestamp: new Date(data.timestamp).toLocaleString(),
              problem: problem,
              message: 'Por favor, revise el sistema de climatización del CPD de inmediato. Los valores están fuera del rango de seguridad.'
            },
            publicKey
          );
          lastEmailSentRef.current = now;
          console.log('Email alert triggered successfully via EmailJS');
        } catch (error) {
          console.error('Error triggering email alert via EmailJS:', error);
        }
      };

      sendEmailAlert();
    }
  }, [data]);

  if (!mounted) return null;

  const tempDisplay = data ? data.temperature.toFixed(1) : "–";
  const humDisplay = data ? data.humidity.toFixed(1) : "–";
  const isHot = data ? data.temperature > 28 : false;
  const isHumid = data ? data.humidity > 78.0 : false;
  const isLow = data ? data.temperature < 15 : false;
  const isCritical = isHot || isLow || isHumid;

  return (
    <div className={clsx(
      "relative w-full flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32 p-8 transition-all duration-1000",
      isFullscreen ? "h-screen" : "min-h-[80vh]",
      isHot ? "bg-red-950/20" : isHumid ? "bg-liquid-gradient" : "",
      isCritical && "animate-pulse-slow"
    )}>
      {/* Audio Toggle */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className={clsx(
            "p-3 rounded-full border transition-all duration-300 flex items-center gap-2",
            isAudioEnabled ? "bg-white/10 border-white/20 text-white" : "bg-red-500/20 border-red-500/40 text-red-400"
          )}
        >
          {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          <span className="text-[10px] uppercase font-mono tracking-widest hidden md:block">
            {isAudioEnabled ? "Alerts On" : "Alerts Muted"}
          </span>
        </button>
      </div>

      {/* Alert Banner */}
      <AnimatePresence>
        {isCritical && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-red-600 text-white px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl shadow-red-600/50"
          >
            <AlertTriangle size={18} className="animate-bounce" />
            <span className="font-mono text-sm font-bold tracking-tighter uppercase">
              {isHot ? "CRITICAL HEAT: > 28°C" : isLow ? "CRITICAL COLD: < 15°C" : "CRITICAL HUMIDITY: > 78%"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Temperature Block */}
      <motion.div 
        className={clsx(
          "relative flex flex-col items-center justify-center group w-full md:w-1/2 h-64 md:h-96 cursor-pointer rounded-3xl transition-all duration-500 hover:bg-white/5",
          isHot && "border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
        )}
        onMouseEnter={() => setCursorState('thermal')}
        onMouseLeave={() => setCursorState('default')}
        onClick={() => setExpandedMetric('temperature')}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      >
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none z-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <Area type="monotone" dataKey="temperature" stroke={isHot ? "#EF4444" : "#FF3B00"} fill={isHot ? "#EF4444" : "#FF3B00"} strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <motion.div 
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-thermal"
          initial={{ rotate: -45 }}
          whileHover={{ rotate: 0, scale: 1.1 }}
        >
          <Maximize2 size={24} />
        </motion.div>

        <div className="flex flex-col items-center z-10">
          <span className="text-[10px] md:text-xs font-sans tracking-[0.1em] text-white/50 uppercase mb-1 group-hover:text-thermal transition-colors duration-300">
            CPD Temperature
          </span>
          <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-4">
            Safe Range: 15°C - 29°C
          </span>
        </div>

        <div className="flex items-start z-10">
          <span 
            className={clsx(
              "font-display text-[20vw] md:text-[12vw] leading-none tracking-[-0.04em] tabular-data glitch-text-thermal transition-all duration-500",
              isHot ? "text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" : "text-white group-hover:drop-shadow-[0_0_30px_rgba(255,59,0,0.5)]"
            )}
            data-text={tempDisplay}
          >
            {tempDisplay}
          </span>
          <span className={clsx(
            "font-display text-4xl md:text-6xl mt-4 md:mt-8 transition-all duration-500",
            isHot ? "text-red-500" : "text-thermal"
          )}>°C</span>
        </div>
      </motion.div>

      {/* Humidity Block */}
      <motion.div 
        className="relative flex flex-col items-center justify-center group w-full md:w-1/2 h-64 md:h-96 cursor-pointer rounded-3xl transition-all duration-500 hover:bg-white/5"
        onMouseEnter={() => setCursorState('liquid')}
        onMouseLeave={() => setCursorState('default')}
        onClick={() => setExpandedMetric('humidity')}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
      >
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none z-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <Area type="monotone" dataKey="humidity" stroke="#00F0FF" fill="#00F0FF" strokeWidth={2} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <motion.div 
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-liquid"
          initial={{ rotate: -45 }}
          whileHover={{ rotate: 0, scale: 1.1 }}
        >
          <Maximize2 size={24} />
        </motion.div>

        <span className="text-[10px] md:text-xs font-sans tracking-[0.1em] text-white/50 uppercase mb-4 z-10 group-hover:text-liquid transition-colors duration-300">
          CPD Humidity
        </span>
        <div className="flex items-start z-10">
          <span 
            className="font-display text-[20vw] md:text-[12vw] leading-none tracking-[-0.04em] tabular-data text-white glitch-text-liquid group-hover:drop-shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-500"
            data-text={humDisplay}
          >
            {humDisplay}
          </span>
          <span className="font-display text-4xl md:text-6xl mt-4 md:mt-8 text-liquid group-hover:drop-shadow-[0_0_20px_rgba(0,240,255,0.8)] transition-all duration-500">%</span>
        </div>
      </motion.div>
    </div>
  );
}
