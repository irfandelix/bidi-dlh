'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function EasterEggPlant({ logoRef }: { logoRef: React.RefObject<HTMLElement | null> }) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });
  const [logoPos, setLogoPos] = useState({ x: 500, y: 50 });

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
      if (!logoRef.current) return;
      const rect = logoRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
      
      // Start growing when mouse is within 300px. Fully grown at 0px.
      const p = Math.max(0, Math.min(1, 1 - (distance / 300)));
      setProgress(p);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [logoRef]);

  if (!mounted) return null;

  // We want the vine to grow from bottom-left (0, H) to the logo (logoX, logoY)
  // We use a quadratic bezier curve.
  const startX = 0;
  const startY = windowSize.h;
  const endX = logoPos.x - 20; // Slightly left of the logo
  const endY = logoPos.y;
  const controlX = startX;
  const controlY = endY; // Curve goes up the left edge, then arches right to the logo

  // Vine path
  const pathData = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;

  // Clip path is a circle that grows from the start point to cover the whole screen.
  const maxRadius = Math.sqrt(windowSize.w * windowSize.w + windowSize.h * windowSize.h);
  const currentRadius = progress * maxRadius;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[60] hidden xl:block overflow-hidden">
      <svg width={windowSize.w} height={windowSize.h} className="absolute inset-0">
        <defs>
          <clipPath id="vine-clip">
            <circle cx={startX} cy={startY} r={currentRadius} className="transition-all duration-100 ease-out" />
          </clipPath>
        </defs>

        <g clipPath="url(#vine-clip)">
          {/* Main Stem */}
          <path 
            d={pathData} 
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />
          
          {/* Leaf 1 */}
          <path d={`M ${startX + 20},${startY - 100} Q ${startX + 60},${startY - 120} ${startX + 80},${startY - 80} Q ${startX + 40},${startY - 60} ${startX + 20},${startY - 100}`} fill="#22c55e" />
          
          {/* Leaf 2 */}
          <path d={`M ${controlX + 50},${controlY + 200} Q ${controlX + 100},${controlY + 220} ${controlX + 120},${controlY + 170} Q ${controlX + 70},${controlY + 150} ${controlX + 50},${controlY + 200}`} fill="#22c55e" />
          
          {/* Leaf 3 */}
          <path d={`M ${endX - 150},${endY + 30} Q ${endX - 130},${endY - 10} ${endX - 100},${endY + 20} Q ${endX - 120},${endY + 60} ${endX - 150},${endY + 30}`} fill="#22c55e" />
          
          {/* Flower at the end (blooms when progress > 0.95) */}
          <g 
            transform={`translate(${endX}, ${endY}) scale(${progress > 0.95 ? (progress - 0.95) * 20 : 0})`}
            className="transition-transform duration-200 ease-out"
          >
            {/* Petals */}
            <circle cx="0" cy="-15" r="15" fill="#f472b6" />
            <circle cx="15" cy="-5" r="15" fill="#f472b6" />
            <circle cx="10" cy="15" r="15" fill="#f472b6" />
            <circle cx="-10" cy="15" r="15" fill="#f472b6" />
            <circle cx="-15" cy="-5" r="15" fill="#f472b6" />
            {/* Center */}
            <circle cx="0" cy="0" r="10" fill="#fde047" />
          </g>
        </g>
      </svg>
    </div>,
    document.body
  );
}
