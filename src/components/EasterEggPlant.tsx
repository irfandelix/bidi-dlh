'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import plantAnimation from '../assets/plant-lottie.json';

export default function EasterEggPlant({ logoRef }: { logoRef: React.RefObject<HTMLElement | null> }) {
  const [mounted, setMounted] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });
  const [logoPos, setLogoPos] = useState({ x: 500, y: 50 });
  
  const lottieLeftRef = useRef<LottieRefCurrentProps>(null);
  const lottieRightRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    setMounted(true);
    
    const updateSize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
      if (logoRef.current) {
        const rect = logoRef.current.getBoundingClientRect();
        setLogoPos({ x: rect.left, y: rect.top + rect.height / 2 });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!logoRef.current || !lottieLeftRef.current || !lottieRightRef.current) return;
      const rect = logoRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
      
      // Start growing when mouse is within 300px. Fully grown at 0px.
      const p = Math.max(0, Math.min(1, 1 - (distance / 300)));
      
      // Map progress to Lottie frames
      const totalFrames = lottieLeftRef.current?.getDuration(true) || 0;
      if (totalFrames > 0) {
        const targetFrame = p * totalFrames;
        lottieLeftRef.current?.goToAndStop(targetFrame, true);
        lottieRightRef.current?.goToAndStop(targetFrame, true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [logoRef]);

  if (!mounted) return null;

  const size = 600; // 3x the original size

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[60] hidden xl:block">
      {/* Left Plant */}
      <div 
        className="absolute"
        style={{ 
          width: size, 
          height: size,
          left: -150, // Push left to eliminate padding gap
          bottom: -150 // Push down to hide the dirt
        }}
      >
        <Lottie 
          lottieRef={lottieLeftRef}
          animationData={plantAnimation}
          loop={false}
          autoplay={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Right Plant (Mirrored) */}
      <div 
        className="absolute"
        style={{ 
          width: size, 
          height: size, 
          right: -150, // Push right to eliminate padding gap
          bottom: -150, // Push down to hide the dirt
          transform: 'scaleX(-1)' 
        }}
      >
        <Lottie 
          lottieRef={lottieRightRef}
          animationData={plantAnimation}
          loop={false}
          autoplay={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>,
    document.body
  );
}
