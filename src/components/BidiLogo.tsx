'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EasterEggPlant from './EasterEggPlant';

export default function BidiLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      <EasterEggPlant logoRef={containerRef} />
      {/* Actual Logo Link */}
      <Link 
        href="/" 
        className="relative z-10 flex flex-col items-center justify-center transition-all hover:scale-105 hover:-translate-y-0.5 w-11 h-11"
      >
        <Image 
          src="/BIDIDLH.png" 
          alt="BIDI DLH Logo" 
          width={44} 
          height={44} 
          className="rounded-lg shadow-sm hover:shadow-md object-contain"
        />
      </Link>
    </div>
  );
}
