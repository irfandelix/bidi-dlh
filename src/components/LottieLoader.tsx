'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import loadingAnimation from '../../public/loading.json';

// Use dynamic import for Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface LottieLoaderProps {
  size?: number;
  text?: string;
}

export default function LottieLoader({ size = 150, text }: LottieLoaderProps) {
  if (text) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full min-h-[60vh]">
        <div style={{ width: size, height: size, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lottie animationData={loadingAnimation} loop={true} />
        </div>
        <span className="font-black text-slate-900 uppercase tracking-widest text-lg animate-pulse">
          {text}
        </span>
      </div>
    );
  }

  // Inline mode for buttons
  return (
    <div style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Lottie animationData={loadingAnimation} loop={true} />
    </div>
  );
}
