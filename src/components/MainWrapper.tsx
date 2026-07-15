'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <>
      {!isLogin && <Navbar />}
      <main className={isLogin ? "flex-1 flex w-full" : "flex-1 pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"}>
        {children}
      </main>
    </>
  );
}
