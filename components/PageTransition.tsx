"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Global Transition Context for component-level transitions
export const TransitionContext = createContext({
  triggerTransition: () => {},
  isTransitioning: false,
});

export const useTransition = () => useContext(TransitionContext);

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');
  const [transitionContext, setTransitionContext] = useState({
    triggerTransition: () => {},
    isTransitioning: false,
  });

  // Global page transition logic - smooth and instant
  useEffect(() => {
    const handleRouteChange = () => {
      setIsLoading(false); // Remove loading state
      setTransitionPhase('fade-out');

      const timer = setTimeout(() => {
        setTransitionPhase('fade-in');
        setTimeout(() => {
          setTransitionPhase('idle');
        }, 500);
      }, 150);
      return () => clearTimeout(timer);
    };

    // Update context - simpler transition without loading overlay
    setTransitionContext({
      triggerTransition: () => {
        setTransitionPhase('fade-out');
        setTimeout(() => {
          setTransitionPhase('fade-in');
          setTimeout(() => {
            setTransitionPhase('idle');
          }, 500);
        }, 150);
      },
      isTransitioning: transitionPhase !== 'idle',
    });

    handleRouteChange();
  }, [pathname, searchParams]);

  // Reset on route change
  useEffect(() => {
    setTransitionPhase('idle');
  }, [pathname]);

  return (
    <TransitionContext.Provider value={transitionContext}>
      {/* Page Content with ultra smooth fade transitions only */}
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

      <style jsx>{`
        .page-transition {
          transition: all 400ms ease-out;
          will-change: transform, opacity;
        }

        .fade-out {
          opacity: 0;
          transform: scale(0.995) translateY(1px);
        }

        .fade-in {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      `}</style>
    </TransitionContext.Provider>
  );
}

// Hook for component-level transitions
export function useComponentTransition() {
  const { triggerTransition, isTransitioning } = useTransition();

  const fadeIn = (element: HTMLElement, delay = 0) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px) scale(0.95)';
    element.style.filter = 'blur(4px)';

    setTimeout(() => {
      element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0) scale(1)';
      element.style.filter = 'blur(0)';
    }, delay);
  };

  const fadeOut = (element: HTMLElement, callback?: () => void) => {
    element.style.transition = 'all 0.3s ease-out';
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px) scale(0.98)';
    element.style.filter = 'blur(2px)';

    setTimeout(() => {
      if (callback) callback();
    }, 300);
  };

  return { triggerTransition, isTransitioning, fadeIn, fadeOut };
}
