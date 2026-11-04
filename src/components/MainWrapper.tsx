'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const isPeta = pathname === '/peta';
  const isMobileApp = pathname === '/pengawasan/mobile' || pathname === '/hotline/mobile';
  const isToken = pathname === '/pengawasan/token';

  let mainClass = "flex-1 pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full";
  if (isLogin) {
    mainClass = "flex-1 flex w-full";
  } else if (isPeta) {
    mainClass = "flex flex-col w-full h-[100dvh] pt-[76px] overflow-hidden"; // Full width & locked height for map
  } else if (isMobileApp) {
    mainClass = "flex flex-col w-full h-[100dvh] p-0 m-0 overflow-hidden";
  } else if (isToken) {
    mainClass = "flex flex-col items-center justify-center w-full h-[100dvh] pt-20 pb-4 px-4 max-w-7xl mx-auto overflow-hidden";
  }

  return (
    <>
      {(!isLogin && !isMobileApp) && <Navbar />}
      <main className={mainClass}>
        {children}
      </main>
    </>
  );
}
