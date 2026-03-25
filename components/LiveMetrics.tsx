'use client';

import { useSensorData } from '@/hooks/use-sensor-data';
import { useUIStore } from '@/store/use-ui-store';
import { motion, AnimatePresence } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { Maximize2, Bell as Siren, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import emailjs from '@emailjs/browser';

// Configuración de umbrales (Fácil de ajustar)
const THRESHOLDS = {
  TEMP_HIGH: 28,
  TEMP_LOW: 15,
  HUM_HIGH: 78
};

export function LiveMetrics() {
  const { data, history } = useSensorData();
  const { setCursorState, isFullscreen, setExpandedMetric } = useUIStore();
  const [mounted, setMounted] = useState(false);
  
  // Estado de Alertas
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const hasSentTempAlertRef = useRef(false);
  const hasSentHumAlertRef = useRef(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Lógica de la Sirena (Sonido de Alarma Real)
  useEffect(() => {
    if (!data) return;

    const isTempCritical = data.temperature > THRESHOLDS.TEMP_HIGH || data.temperature < THRESHOLDS.TEMP_LOW;
    const isHumCritical = data.humidity > THRESHOLDS.HUM_HIGH;
    const isAnyCritical = isTempCritical || isHumCritical;

    const startAlarm = async () => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        if (!oscillatorRef.current) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          // Sonido tipo alarma bitonal (más "molesto" y profesional)
          osc.type = 'square';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          
          // Modulación para efecto sirena
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = 2.5; // Velocidad de la sirena
          lfoGain.gain.value = 200;
          
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          
          gain.gain.value = 0.15;
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          lfo.start();
          oscillatorRef.current = osc;
          gainNodeRef.current = gain;
        }
      } catch (e) {
        console.error('Error al iniciar alarma:', e);
      }
    };

    const stopAlarm = () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) {}
        oscillatorRef.current = null;
      }
    };

    if (isAnyCritical && isAudioEnabled) {
      startAlarm();
    } else {
      stopAlarm();
    }

    return () => stopAlarm();
  }, [data, isAudioEnabled]);

  // Lógica de Correo (Independiente para Temp y Hum)
  useEffect(() => {
    if (!data) return;

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) return;

    // 1. Alerta de Temperatura
    const isTempAlert = data.temperature > THRESHOLDS.TEMP_HIGH || data.temperature < THRESHOLDS.TEMP_LOW;
    if (isTempAlert && !hasSentTempAlertRef.current) {
      console.log('🚨 DISPARANDO ALERTA DE TEMPERATURA:', data.temperature);
      hasSentTempAlertRef.current = true;
      emailjs.send(serviceId, templateId, {
        to_email: 'gerardmp2008@gmail.com',
        subject: '🚨 ALERTA: TEMPERATURA CRÍTICA',
        temperature: data.temperature.toFixed(1),
        humidity: data.humidity.toFixed(1),
        problem: data.temperature > THRESHOLDS.TEMP_HIGH ? 'Calor Excesivo' : 'Frío Crítico',
        message: 'La temperatura del CPD está fuera de los límites.'
      }, publicKey)
      .then(() => console.log('✅ Correo de temperatura enviado con éxito'))
      .catch((err) => {
        console.error('❌ Error al enviar correo de temperatura:', err);
        hasSentTempAlertRef.current = false;
      });
    } else if (!isTempAlert && hasSentTempAlertRef.current) {
      console.log('ℹ️ Temperatura normalizada. Reseteando estado de alerta.');
      hasSentTempAlertRef.current = false;
    }

    // 2. Alerta de Humedad
    const isHumAlert = data.humidity > THRESHOLDS.HUM_HIGH;
    if (isHumAlert && !hasSentHumAlertRef.current) {
      console.log('🚨 DISPARANDO ALERTA DE HUMEDAD:', data.humidity);
      hasSentHumAlertRef.current = true;
      emailjs.send(serviceId, templateId, {
        to_email: 'gerardmp2008@gmail.com',
        subject: '🚨 ALERTA: HUMEDAD CRÍTICA',
        temperature: data.temperature.toFixed(1),
        humidity: data.humidity.toFixed(1),
        problem: 'Humedad por encima del 78%',
        message: 'La humedad del CPD es demasiado alta.'
      }, publicKey)
      .then(() => console.log('✅ Correo de humedad enviado con éxito'))
      .catch((err) => {
        console.error('❌ Error al enviar correo de humedad:', err);
        hasSentHumAlertRef.current = false;
      });
    } else if (!isHumAlert && hasSentHumAlertRef.current) {
      console.log('ℹ️ Humedad normalizada. Reseteando estado de alerta.');
      hasSentHumAlertRef.current = false;
    }
  }, [data]);

  if (!mounted) return null;

  const isHot = data ? data.temperature > THRESHOLDS.TEMP_HIGH : false;
  const isLow = data ? data.temperature < THRESHOLDS.TEMP_LOW : false;
  const isHumid = data ? data.humidity > THRESHOLDS.HUM_HIGH : false;
  const isCritical = isHot || isLow || isHumid;

  return (
    <div className={clsx(
      "relative w-full flex flex-col md:flex-row items-center justify-center gap-16 md:gap-32 p-8 transition-all duration-1000",
      isFullscreen ? "h-screen" : "min-h-[80vh]",
      isHot ? "bg-red-950/20" : isHumid ? "bg-liquid-gradient" : "",
      isCritical && "animate-pulse-slow"
    )}>
      {/* BOTÓN DE ALERTA - POSICIÓN INFERIOR PARA EVITAR CONFLICTOS Y ASEGURAR INTERACTIVIDAD */}
      <div className="fixed bottom-8 right-8 z-[999999] flex flex-col items-end gap-4 pointer-events-auto">
        <AnimatePresence>
          {isCritical && !isAudioEnabled && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="bg-red-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-xl border border-red-400 animate-pulse flex items-center gap-2"
            >
              <AlertTriangle size={14} />
              ¡PELIGRO! ACTIVA EL SONIDO DE ALARMA
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onPointerDown={(e) => {
            e.stopPropagation();
            const newState = !isAudioEnabled;
            console.log('!!! BOTÓN DE ALARMA PULSADO !!! Nuevo estado:', newState);
            setIsAudioEnabled(newState);
            
            // Inicialización inmediata y agresiva del AudioContext
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioContextClass();
                console.log('AudioContext Creado');
              }
              if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume().then(() => {
                  console.log('AudioContext Resumido');
                });
              }
            } catch (err) {
              console.error('Error al inicializar audio:', err);
            }
          }}
          className={clsx(
            "group relative flex items-center gap-5 px-8 py-6 rounded-2xl border-2 transition-all duration-300 shadow-2xl hover:scale-105 active:scale-90 cursor-pointer overflow-hidden",
            isAudioEnabled 
              ? "bg-green-600/20 border-green-500 text-green-400 shadow-green-500/20" 
              : "bg-red-600/20 border-red-500 text-red-400 shadow-red-500/20"
          )}
        >
          {/* Efecto de fondo pulsante si hay alerta */}
          {isCritical && !isAudioEnabled && (
            <div className="absolute inset-0 bg-red-600 animate-pulse opacity-30" />
          )}
          
          <div className={clsx(
            "relative z-10 p-3 rounded-xl transition-all duration-500",
            isAudioEnabled ? "bg-green-500 text-black rotate-0" : "bg-red-500 text-white rotate-12"
          )}>
            {isAudioEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
          </div>
          
          <div className="relative z-10 flex flex-col items-start">
            <span className="text-[10px] font-mono font-bold opacity-60 tracking-[0.2em] mb-1">SISTEMA DE ALERTA</span>
            <span className="font-display font-black uppercase tracking-widest text-xl">
              {isAudioEnabled ? "ACTIVADO" : "SILENCIADO"}
            </span>
          </div>

          {/* Brillo dinámico */}
          <div className={clsx(
            "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500",
            isAudioEnabled ? "bg-green-400" : "bg-red-400"
          )} />
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
            data-text={data ? data.temperature.toFixed(1) : "–"}
          >
            {data ? data.temperature.toFixed(1) : "–"}
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
            data-text={data ? data.humidity.toFixed(1) : "–"}
          >
            {data ? data.humidity.toFixed(1) : "–"}
          </span>
          <span className="font-display text-4xl md:text-6xl mt-4 md:mt-8 text-liquid group-hover:drop-shadow-[0_0_20px_rgba(0,240,255,0.8)] transition-all duration-500">%</span>
        </div>
      </motion.div>
    </div>
  );
}
