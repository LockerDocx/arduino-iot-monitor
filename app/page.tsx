import { BootSequence } from '@/components/BootSequence';
import { CustomCursor } from '@/components/CustomCursor';
import { Header } from '@/components/Header';
import { LiveMetrics } from '@/components/LiveMetrics';
import { SmoothScroll } from '@/components/SmoothScroll';
import { ProjectDocumentation } from '@/components/ProjectDocumentation';
import { ChartModal } from '@/components/ChartModal';
import { GestureAuth } from '@/components/GestureAuth';

export default function Home() {
  return (
    <SmoothScroll>
      <main className="relative min-h-screen selection:bg-white/20 selection:text-white">
        <CustomCursor />
        <BootSequence />
        <Header />
        
        {/* Pinned section for Live Metrics */}
        <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden z-10">
          <LiveMetrics />
        </div>
        
        {/* Gesture Authentication Modal */}
        <GestureAuth />
        
        <ChartModal />
      </main>
    </SmoothScroll>
  );
}
