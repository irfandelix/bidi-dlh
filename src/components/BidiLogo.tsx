'use client';

import { useRef } from 'react';
import Link from 'next/link';
import EasterEggPlant from './EasterEggPlant';

export default function BidiLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      <EasterEggPlant logoRef={containerRef} />
      {/* Actual Logo Link */}
      <Link 
        href="/" 
        className="relative z-10 font-bold text-[12px] text-on-surface flex flex-col items-center justify-center bg-surface rounded-lg border border-outline-variant shadow-sm hover:shadow-md transition-shadow hover:scale-105 hover:-translate-y-0.5 hover:shadow-sm hover:shadow-md transition-shadow transition-all w-11 h-11"
      >
        <span className="leading-[1] text-secondary tracking-widest">BIDI</span> 
        <span className="leading-[1] tracking-widest">DLH</span>
      </Link>
    </div>
  );
}
