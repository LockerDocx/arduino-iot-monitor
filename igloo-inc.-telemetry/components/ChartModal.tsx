'use client';

import { useUIStore } from '@/store/use-ui-store';
import { useSensorData } from '@/hooks/use-sensor-data';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useEffect } from 'react';

export function ChartModal() {
  const { expandedMetric, setExpandedMetric } = useUIStore();
  const { history } = useSensorData();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedMetric(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setExpandedMetric]);

  const isTemp = expandedMetric === 'temperature';
  const color = isTemp ? '#FF3B00' : '#00F0FF';
  const title = isTemp ? 'Core Temperature History' : 'Ambient Humidity History';
  const unit = isTemp ? '°C' : '%';
  const dataKey = expandedMetric || 'temperature';

  // Format time for X-axis
  const formattedHistory = history.map(d => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }));

  return (
    <AnimatePresence>
      {expandedMetric && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-md"
          onClick={() => setExpandedMetric(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl h-[70vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                {title}
              </h2>
              <button 
                onClick={() => setExpandedMetric(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chart Area */}
            <div className="flex-1 p-6 md:p-8 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#666" 
                    tick={{ fill: '#888', fontSize: 12 }} 
                    tickMargin={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    stroke="#666" 
                    tick={{ fill: '#888', fontSize: 12 }} 
                    tickFormatter={(val) => `${val}${unit}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: color, fontWeight: 'bold' }}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                    formatter={(value: any) => {
                      if (typeof value === 'number') {
                        return [`${value.toFixed(1)}${unit}`, isTemp ? 'Temperature' : 'Humidity'];
                      }
                      return [value, isTemp ? 'Temperature' : 'Humidity'];
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={dataKey} 
                    stroke={color} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorGradient)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
