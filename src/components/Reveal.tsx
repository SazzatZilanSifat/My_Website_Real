import { type ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade-up' | 'fade-in' | 'fade-down' | 'scale-in' | 'slide-in-right' | 'slide-in-left';
}

export function Reveal({ children, className = '', delay = 0, animation = 'fade-up' }: RevealProps) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translate(0, 0) scale(1)'
          : animation === 'fade-up'
          ? 'translateY(30px)'
          : animation === 'fade-down'
          ? 'translateY(-30px)'
          : animation === 'slide-in-right'
          ? 'translateX(40px)'
          : animation === 'slide-in-left'
          ? 'translateX(-40px)'
          : animation === 'scale-in'
          ? 'scale(0.95)'
          : 'none',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
