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
        className="relative z-10 font-black text-xl text-slate-900 tracking-tight flex items-center gap-2 bg-white px-2 py-1 rounded-lg hover:scale-105 transition-transform"
      >
        <span className="bg-emerald-400 text-slate-900 px-2 py-0.5 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0_0_#0f172a]">BIDI</span> 
        DLH
      </Link>
    </div>
  );
}
