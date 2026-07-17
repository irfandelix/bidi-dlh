'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import plantAnimation from '../assets/plant-lottie.json';

export default function EasterEggPlant({ logoRef }: { logoRef: React.RefObject<HTMLElement | null> }) {
  const [mounted, setMounted] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });
  const [logoPos, setLogoPos] = useState({ x: 500, y: 50 });
  
  const lottieRef = useRef<LottieRefCurrentProps>(null);

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
      if (!logoRef.current || !lottieRef.current) return;
      const rect = logoRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
      
      // Start growing when mouse is within 300px. Fully grown at 0px.
      const p = Math.max(0, Math.min(1, 1 - (distance / 300)));
      
      // Map progress to Lottie frames
      const totalFrames = lottieRef.current.getDuration(true) || 0;
      if (totalFrames > 0) {
        const targetFrame = p * totalFrames;
        lottieRef.current.goToAndStop(targetFrame, true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [logoRef]);

  if (!mounted) return null;

  // Let's place the Lottie animation anchored to the left of the logo
  // We can just position the container right next to the logo.
  // Instead of growing from the bottom-left corner of the screen,
  // most Lottie plant animations are designed to grow "up" from their base.
  // So we will position the Lottie container right on top of the logo or next to it.
  
  const size = 200; // Adjust size as needed

  return createPortal(
    <div 
      className="fixed pointer-events-none z-[60] hidden xl:block"
      style={{
        left: logoPos.x - (size * 0.75), // Shift slightly left so it grows next to it
        top: logoPos.y - (size * 0.8), // Shift up so the base is near the logo
        width: size,
        height: size,
      }}
    >
      <Lottie 
        lottieRef={lottieRef}
        animationData={plantAnimation}
        loop={false}
        autoplay={false}
        style={{ width: '100%', height: '100%' }}
      />
    </div>,
    document.body
  );
}
