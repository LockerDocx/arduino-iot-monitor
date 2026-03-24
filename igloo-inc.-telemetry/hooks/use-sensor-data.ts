import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: number;
}

let globalHistory: SensorData[] = [];
let listeners: ((history: SensorData[]) => void)[] = [];

export function useSensorData() {
  const [history, setHistory] = useState<SensorData[]>(globalHistory);

  useEffect(() => {
    // Escuchamos el documento 'latest' en la colección 'telemetry' en tiempo real
    const unsubscribe = onSnapshot(doc(db, 'telemetry', 'latest'), (snapshot) => {
      const data = snapshot.data();
      
      if (data && typeof data.temp === 'number' && typeof data.hum === 'number') {
        const newData: SensorData = {
          temperature: data.temp,
          humidity: data.hum,
          timestamp: data.timestamp || Date.now(),
        };

        // Evitar duplicados si el timestamp es el mismo
        const lastEntry = globalHistory[globalHistory.length - 1];
        if (lastEntry && lastEntry.timestamp === newData.timestamp) return;

        globalHistory = [...globalHistory, newData];
        if (globalHistory.length > 30) globalHistory.shift();

        setHistory(globalHistory);
        listeners.forEach(listener => listener(globalHistory));
      }
    }, (error) => {
      console.error("Error listening to Firestore:", error);
    });

    const listener = (newHistory: SensorData[]) => {
      setHistory(newHistory);
    };
    
    listeners.push(listener);
    
    return () => {
      unsubscribe();
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const data = history.length > 0 ? history[history.length - 1] : null;

  return { data, history };
}
