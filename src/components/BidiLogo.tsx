'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function BidiLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLAnchorElement>(null);
  
  const [pawStyle, setPawStyle] = useState({
    opacity: 0,
    transform: 'translate(-50%, -50%) rotate(0deg) translateY(0px) scale(0.5)',
  });
  
  const [isHoveringText, setIsHoveringText] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Calculate mouse position relative to the center of the container
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    
    // Calculate angle in degrees
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Calculate distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // The paw should point towards the mouse.
    // If the SVG points UP by default (0 degrees), then we need to rotate it by angle + 90
    const rotation = angle + 90;
    
    // How far out the paw should reach (cap it so it doesn't go too far)
    // The base distance to peek out of the button is around 30-40px
    const reach = Math.min(45, Math.max(10, distance * 0.4));

    if (isHoveringText) {
      // Hide if directly over text
      setPawStyle({
        opacity: 0,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(0px) scale(0.5)`,
      });
    } else {
      // Show paw
      setPawStyle({
        opacity: 1,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) translateY(-${reach}px) scale(1)`,
      });
    }
  };

  const handleMouseLeave = () => {
    setPawStyle(prev => ({
      ...prev,
      opacity: 0,
      transform: prev.transform.replace(/translateY\([^\)]+\)/, 'translateY(0px)').replace(/scale\([^\)]+\)/, 'scale(0.5)'),
    }));
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center cursor-default group"
    >
      {/* Big invisible hover zone */}
      <div className="absolute -inset-10 z-0"></div>
      {/* Cat Paw SVG */}
      <div 
        className="absolute top-1/2 left-1/2 pointer-events-none transition-all duration-200 ease-out z-0"
        style={{
          ...pawStyle,
          transformOrigin: '50% 100%' // Anchor at the bottom of the paw
        }}
      >
        <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Paw body */}
          <path d="M 30,90 C 30,10 70,10 70,90 Z" fill="white" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Paw pads / claws (simplified as claws) */}
          <line x1="42" y1="20" x2="42" y2="35" stroke="#0f172a" strokeWidth="4" strokeLinecap="round"/>
          <line x1="58" y1="20" x2="58" y2="35" stroke="#0f172a" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Actual Logo Link */}
      <Link 
        ref={textRef}
        href="/" 
        onMouseEnter={() => setIsHoveringText(true)}
        onMouseLeave={() => setIsHoveringText(false)}
        className="relative z-10 font-black text-xl text-slate-900 tracking-tight flex items-center gap-2 bg-white px-2 py-1 rounded-lg"
      >
        <span className="bg-emerald-400 text-slate-900 px-2 py-0.5 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0_0_#0f172a]">BIDI</span> 
        DLH
      </Link>
    </div>
  );
}
