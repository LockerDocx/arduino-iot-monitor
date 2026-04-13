'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { HandLandmarker } from '@mediapipe/tasks-vision';
import { Lock, Unlock, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '@/store/use-ui-store';

interface Point {
  x: number;
  y: number;
}

// --- Math & Geometry Helpers ---
function getPathLength(pts: Point[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return d;
}

function resample(pts: Point[], n: number) {
  if (pts.length === 0) return [];
  const I = getPathLength(pts) / (n - 1);
  let D = 0;
  const newPts = [pts[0]];
  let i = 1;
  const currentPts = [...pts];

  while (i < currentPts.length) {
    const pt1 = currentPts[i - 1];
    const pt2 = currentPts[i];
    const d = Math.hypot(pt2.x - pt1.x, pt2.y - pt1.y);
    if (D + d >= I) {
      const qx = pt1.x + ((I - D) / d) * (pt2.x - pt1.x);
      const qy = pt1.y + ((I - D) / d) * (pt2.y - pt1.y);
      const q = { x: qx, y: qy };
      newPts.push(q);
      currentPts.splice(i, 0, q);
      D = 0;
    } else {
      D += d;
    }
    i++;
  }
  if (newPts.length === n - 1) {
    newPts.push(pts[pts.length - 1]);
  }
  return newPts;
}

function normalize(pts: Point[]) {
  if (pts.length === 0) return [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const width = Math.max(maxX - minX, 0.0001);
  const height = Math.max(maxY - minY, 0.0001);
  return pts.map(p => ({
    x: (p.x - minX) / width,
    y: (p.y - minY) / height
  }));
}

function perpendicularDistance(pt: Point, lineStart: Point, lineEnd: Point) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.hypot(dx, dy);
  if (mag > 0.0) {
    const dx1 = pt.x - lineStart.x;
    const dy1 = pt.y - lineStart.y;
    const cross = dx * dy1 - dx1 * dy;
    return Math.abs(cross) / mag;
  }
  return Math.hypot(pt.x - lineStart.x, pt.y - lineStart.y);
}

function douglasPeucker(pts: Point[], epsilon: number): Point[] {
  if (pts.length <= 2) return pts;
  let dmax = 0;
  let index = 0;
  const end = pts.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(pts[i], pts[0], pts[end]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }
  if (dmax > epsilon) {
    const recResults1 = douglasPeucker(pts.slice(0, index + 1), epsilon);
    const recResults2 = douglasPeucker(pts.slice(index), epsilon);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [pts[0], pts[end]];
  }
}

// Template: A Square
const squareTemplate: Point[] = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }
];
const resampledTemplate = resample(squareTemplate, 64);

function getMatchPercentage(trajectory: Point[]) {
  if (trajectory.length < 15) return 0; // Not enough points
  
  // 1. Normalize first to make epsilon consistent
  const normalizedRaw = normalize(trajectory);
  
  // 2. Rectify segments using Douglas-Peucker (epsilon = 0.1 for a 1x1 bounding box)
  const rectified = douglasPeucker(normalizedRaw, 0.1);
  
  // 3. Resample the rectified shape
  const resampled = resample(rectified, 64);
  
  // 4. Re-normalize just in case
  const normalized = normalize(resampled);

  let bestDistance = Infinity;
  
  // Try different starting points (shift the array) to be rotation/start invariant
  for (let shift = 0; shift < 64; shift += 2) {
    // Try both directions (clockwise / counter-clockwise)
    for (const direction of [1, -1]) {
      let distance = 0;
      for (let i = 0; i < 64; i++) {
        let templateIdx = (shift + direction * i) % 64;
        if (templateIdx < 0) templateIdx += 64;
        
        distance += Math.hypot(
          normalized[i].x - resampledTemplate[templateIdx].x, 
          normalized[i].y - resampledTemplate[templateIdx].y
        );
      }
      distance /= 64;
      if (distance < bestDistance) bestDistance = distance;
    }
  }

  // Convert distance to percentage. 
  // A perfect match is distance 0. 
  const percentage = Math.max(0, 100 - (bestDistance * 180));
  return Math.min(100, Math.round(percentage));
}

export function GestureAuth() {
  const { isUnlockModalOpen, setUnlockModalOpen, setAlarmUnlocked } = useUIStore();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState(0);
  const threshold = 65; // Fixed threshold
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPinched, setIsPinched] = useState(false);
  
  const trajectoryRef = useRef<Point[]>([]);
  const isPinchedRef = useRef(false);
  const isAuthenticatedRef = useRef(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

  useEffect(() => {
    if (!isUnlockModalOpen) {
      // Cleanup when closed
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
      setIsCameraReady(false);
      setMatchPercentage(0);
      setIsAuthenticated(false);
      setIsPinched(false);
      trajectoryRef.current = [];
      isPinchedRef.current = false;
      isAuthenticatedRef.current = false;
      return;
    }

    let active = true;

    const initMediaPipe = async () => {
      try {
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (!active) return;
        handLandmarkerRef.current = landmarker;

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
            predictWebcam();
          };
        }
      } catch (error) {
        console.error("Error initializing MediaPipe Tasks Vision:", error);
      }
    };

    initMediaPipe();

    return () => {
      active = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, [isUnlockModalOpen]);

  const predictWebcam = () => {
    if (!videoRef.current || !canvasRef.current || !handLandmarkerRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      const results = handLandmarkerRef.current.detectForVideo(video, performance.now());

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw hidden template guide (faint)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(canvas.width * 0.3, canvas.height * 0.3, canvas.width * 0.4, canvas.height * 0.4);
      ctx.setLineDash([]);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        // Calculate distance between thumb and index tip
        const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
        const currentlyPinched = distance < 0.08; // Threshold for pinch

        if (currentlyPinched !== isPinchedRef.current) {
          isPinchedRef.current = currentlyPinched;
          setIsPinched(currentlyPinched);
          if (currentlyPinched) {
            if (!isAuthenticatedRef.current) {
              trajectoryRef.current = [];
              setMatchPercentage(0);
            }
          }
        }

        if (currentlyPinched && !isAuthenticatedRef.current) {
          // Add point to trajectory (using midpoint of pinch)
          const midX = (indexTip.x + thumbTip.x) / 2;
          const midY = (indexTip.y + thumbTip.y) / 2;
          
          // Simple smoothing (moving average with last point)
          const lastPt = trajectoryRef.current[trajectoryRef.current.length - 1];
          const smoothedX = lastPt ? (lastPt.x * 0.5 + midX * 0.5) : midX;
          const smoothedY = lastPt ? (lastPt.y * 0.5 + midY * 0.5) : midY;

          trajectoryRef.current.push({ x: smoothedX, y: smoothedY });

          // Calculate match percentage in real-time
          const percentage = getMatchPercentage(trajectoryRef.current);
          setMatchPercentage(percentage);

          if (percentage >= threshold) {
            isAuthenticatedRef.current = true;
            setIsAuthenticated(true);
            
            // Play success sound
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(800, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch (e) {}

            // Unlock the alarm and close modal after a short delay
            setTimeout(() => {
              setAlarmUnlocked(true);
              setUnlockModalOpen(false);
            }, 1500);
          }
        }

        // Draw hand landmarks (minimal)
        ctx.fillStyle = currentlyPinched ? '#00F0FF' : '#FF3B00';
        ctx.beginPath();
        ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(thumbTip.x * canvas.width, thumbTip.y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw trajectory
      if (trajectoryRef.current.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = isAuthenticatedRef.current ? '#22c55e' : '#00F0FF';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const pts = trajectoryRef.current;
        ctx.moveTo(pts[0].x * canvas.width, pts[0].y * canvas.height);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x * canvas.width, pts[i].y * canvas.height);
        }
        ctx.stroke();
      }

      ctx.restore();
    }
    
    animationRef.current = requestAnimationFrame(predictWebcam);
  };

  const resetAuth = () => {
    isAuthenticatedRef.current = false;
    setIsAuthenticated(false);
    trajectoryRef.current = [];
    setMatchPercentage(0);
  };

  return (
    <AnimatePresence>
      {isUnlockModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative flex flex-col items-center justify-center w-full max-w-3xl mx-auto p-6 bg-carbon rounded-3xl border border-white/10 shadow-2xl"
          >
            <button 
              onClick={() => setUnlockModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-liquid" size={24} />
                <h2 className="text-xl font-display font-bold text-white tracking-widest uppercase">
                  Desbloqueo Biométrico
                </h2>
              </div>
              <div className="flex items-center gap-4 mr-12">
                <button 
                  onClick={resetAuth}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
                  title="Reset"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/5">
              {!isCameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                  <div className="w-8 h-8 border-2 border-liquid border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Inicializando Cámara...</p>
                </div>
              )}
              
              {/* Video Feed (Mirrored) */}
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-40"
                playsInline 
                muted 
              />
              
              {/* Canvas Overlay */}
              <canvas 
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover -scale-x-100 z-10"
              />

              {/* Instructions Overlay */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <p className="text-xs font-mono text-white/80">
                    {isPinched ? "Dibujando..." : "Junta el índice y el pulgar para dibujar un cuadrado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Real-time Feedback Panel */}
            <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                <span className="text-[10px] font-mono text-white/50 uppercase mb-2">Match Percentage (Target: {threshold}%)</span>
                <div className="flex items-end gap-3">
                  <span className={clsx(
                    "text-4xl font-display font-bold tabular-nums transition-colors duration-300",
                    matchPercentage >= threshold ? "text-green-500" : "text-liquid"
                  )}>
                    {matchPercentage}%
                  </span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <motion.div 
                      className={clsx("h-full", matchPercentage >= threshold ? "bg-green-500" : "bg-liquid")}
                      initial={{ width: 0 }}
                      animate={{ width: `${matchPercentage}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              <div className={clsx(
                "p-4 rounded-2xl border flex items-center justify-center gap-4 transition-all duration-500",
                isAuthenticated 
                  ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.2)]" 
                  : "bg-white/5 border-white/5 text-white/50"
              )}>
                {isAuthenticated ? <Unlock size={32} /> : <Lock size={32} />}
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">Status</span>
                  <span className="text-lg font-bold uppercase tracking-wider">
                    {isAuthenticated ? "Coincide la contraseña" : "Awaiting Input"}
                  </span>
                </div>
              </div>
            </div>

            {/* Fallback Option */}
            <div className="w-full mt-6 flex justify-center">
              <button className="text-xs font-mono text-white/40 hover:text-white/80 transition-colors underline underline-offset-4">
                ¿La cámara falla? Usar contraseña alternativa (PIN)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
