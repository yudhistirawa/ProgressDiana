"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');

  // Simple page transition logic
  useEffect(() => {
    setTransitionPhase('fade-out');

    const timer = setTimeout(() => {
      setTransitionPhase('fade-in');
      setTimeout(() => {
        setTransitionPhase('idle');
      }, 500);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Reset on route change
  useEffect(() => {
    setTransitionPhase('idle');
  }, [pathname]);

  return (
    <div
      className={`transition-all duration-[400ms] ease-out ${
        transitionPhase === 'fade-out'
          ? 'opacity-0 scale-[0.995] translate-y-1'
          : 'opacity-100 scale-100 translate-y-0'
      }`}
      style={{
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
}
