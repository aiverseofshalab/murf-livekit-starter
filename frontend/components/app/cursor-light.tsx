'use client';

import { useEffect, useRef } from 'react';

export function CursorLight() {
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable on touch devices or reduced motion preference
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 3;
    let currentX = targetX;
    let currentY = targetY;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      // Smooth lerp interpolation
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (lightRef.current) {
        lightRef.current.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="cursor-light pointer-events-none fixed inset-0 z-0 hidden overflow-hidden md:block">
      {/* Primary Light Field following Cursor */}
      <div
        ref={lightRef}
        className="absolute top-0 left-0 size-[500px] rounded-full bg-gradient-to-tr from-[#5EEAD4]/20 via-[#0F766E]/15 to-[#D6A756]/10 opacity-70 blur-[130px] transition-opacity duration-500"
      />
      {/* Background Soft Static Glow Orbs */}
      <div className="absolute -top-32 -left-32 size-[600px] rounded-full bg-[#5EEAD4]/10 blur-[150px]" />
      <div className="absolute top-1/2 -right-32 size-[600px] rounded-full bg-[#0F766E]/10 blur-[160px]" />
    </div>
  );
}
