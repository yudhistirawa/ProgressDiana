"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Global Transition Context for component-level transitions
export const TransitionContext = createContext({
  triggerTransition: () => {},
  isTransitioning: false,
});

export const useTransition = () => useContext(TransitionContext);

export default function PageTransition({ children }: { children: React.ReactNode }) {
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

      <style jsx global>{`
            /* Enhanced Keyframe Animations */
            @keyframes loading-shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }

            @keyframes loading-progress {
              0% { width: 0%; background-position: 0% 50%; }
              50% { width: 60%; background-position: 100% 50%; }
              100% { width: 80%; background-position: 200% 50%; }
            }

            @keyframes bounce-fade {
              0%, 100% {
                opacity: 0.4;
                transform: scale(0.8) translate(-50%, -50%);
              }
              50% {
                opacity: 1;
                transform: scale(1) translate(-50%, -50%);
              }
            }

            @keyframes page-fade-in {
              from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                filter: blur(4px);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0);
              }
            }

            @keyframes page-fade-out {
              from {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0);
              }
              to {
                opacity: 0.3;
                transform: translateY(10px) scale(0.98);
                filter: blur(2px);
              }
            }

            @keyframes alert-bounce-in {
              0% {
                transform: scale(0.3) translateY(-50px);
                opacity: 0;
                filter: blur(4px);
              }
              50% {
                transform: scale(1.05) translateY(0px);
                opacity: 1;
                filter: blur(0);
              }
              70% {
                transform: scale(0.95) translateY(0px);
                opacity: 1;
                filter: blur(0);
              }
              100% {
                transform: scale(1) translateY(0px);
                opacity: 1;
                filter: blur(0);
              }
            }

            @keyframes modal-slide-in {
              from {
                opacity: 0;
                transform: translateY(50px) scale(0.9);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes modal-scale-in {
              from {
                opacity: 0;
                transform: scale(0.8);
                filter: blur(4px);
              }
              to {
                opacity: 1;
                transform: scale(1);
                filter: blur(0);
              }
            }

            /* CSS Custom Properties for Theme Colors */
            :root {
              --color-primary: #dc2626;
              --color-primary-dark: #b91c1c;
              --color-primary-light: #fca5a5;
              --color-neutral-50: #fafafa;
              --color-neutral-100: #f5f5f5;
              --color-neutral-200: #e5e5e5;
              --color-neutral-300: #d4d4d4;
              --color-neutral-400: #a3a3a3;
              --color-neutral-500: #737373;
              --color-neutral-600: #525252;
              --color-neutral-700: #404040;
              --color-neutral-800: #262626;
              --color-neutral-900: #171717;
            }

            /* Utility Classes for Smooth Transitions */
            .transition-smooth {
              transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .transition-bounce {
              transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .transition-elastic {
              transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
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
