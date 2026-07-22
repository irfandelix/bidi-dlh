'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import loadingAnimation from '../../public/loading.json';

// Use dynamic import for Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function LottieLoader({ size = 80 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Lottie animationData={loadingAnimation} loop={true} />
    </div>
  );
}
