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
        className="relative z-10 font-black text-[12px] text-slate-900 flex flex-col items-center justify-center bg-white rounded-lg border-2 border-slate-900 shadow-[2px_2px_0_0_#0f172a] hover:scale-105 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#0f172a] transition-all w-11 h-11"
      >
        <span className="leading-[1] text-emerald-600 tracking-widest">BIDI</span> 
        <span className="leading-[1] tracking-widest">DLH</span>
      </Link>
    </div>
  );
}
