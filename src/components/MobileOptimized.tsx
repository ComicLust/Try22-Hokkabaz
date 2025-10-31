'use client';

import { useState, useEffect, ReactNode, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load heavy components
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded" />
});

const MotionSection = dynamic(() => import('framer-motion').then(mod => mod.motion.section), {
  ssr: false,
  loading: () => <section className="animate-pulse bg-gray-200 rounded" />
});

interface MobileOptimizedProps {
  children: ReactNode;
  enableAnimations?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article';
  motionProps?: any;
}

export default function MobileOptimized({ 
  children, 
  enableAnimations = true,
  className = '',
  as = 'div',
  motionProps = {}
}: MobileOptimizedProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Mobil kontrol
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Reduced motion kontrol
    const checkReducedMotion = () => {
      setPrefersReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    checkMobile();
    checkReducedMotion();

    window.addEventListener('resize', checkMobile);
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkReducedMotion);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', checkReducedMotion);
    };
  }, []);

  // Mobilde veya reduced motion tercihinde animasyonları devre dışı bırak
  const shouldUseAnimations = enableAnimations && !prefersReducedMotion && !isMobile;

  if (!shouldUseAnimations) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Suspense fallback={<div className={`animate-pulse bg-gray-200 rounded ${className}`} />}>
      {as === 'section' ? (
        <MotionSection className={className} {...motionProps}>
          {children}
        </MotionSection>
      ) : (
        <MotionDiv className={className} {...motionProps}>
          {children}
        </MotionDiv>
      )}
    </Suspense>
  );
}

// Hook for mobile detection
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook for connection speed detection
export function useConnectionSpeed() {
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');

  useEffect(() => {
    // @ts-ignore - Navigator connection API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const updateConnectionSpeed = () => {
        // 2G, slow-2g, 3g kabul et slow olarak
        const slowConnections = ['slow-2g', '2g', '3g'];
        setConnectionSpeed(
          slowConnections.includes(connection.effectiveType) ? 'slow' : 'fast'
        );
      };

      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);

      return () => {
        connection.removeEventListener('change', updateConnectionSpeed);
      };
    }
  }, []);

  return connectionSpeed;
}