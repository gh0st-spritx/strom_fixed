'use client';
import { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the movement
  const springConfig = { damping: 25, stiffness: 150 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches || 'ontouchstart' in window);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check if hovering over a clickable element
      const target = e.target as HTMLElement;
      const isClickable = !!(
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') || 
        target.closest('a') ||
        window.getComputedStyle(target).cursor === 'pointer'
      );
      
      setIsPointer(isClickable);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    checkMobile();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('resize', checkMobile);

    // Hide default cursor globally
    if (!isMobile) {
      document.body.style.cursor = 'none';
      const style = document.createElement('style');
      style.innerHTML = `
        a, button, [role="button"] {
          cursor: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('resize', checkMobile);
      document.body.style.cursor = 'auto';
    };
  }, [mouseX, mouseY, isVisible, isMobile]);

  if (isMobile || !isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      {/* Japanese Maple Leaf SVG */}
      <motion.svg
        width="32"
        height="32"
        viewBox="0 0 100 100"
        animate={{
          scale: isPointer ? 1.5 : 1,
          rotate: isPointer ? 45 : 0,
          filter: isPointer ? 'drop-shadow(0 0 8px rgba(220, 38, 38, 0.8))' : 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.5))'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-red-600 fill-current"
      >
        <path d="M50 95C50 95 48 70 48 65C48 60 52 60 52 65C52 70 50 95 50 95Z" />
        <path d="M50 65L20 75L35 55L10 45L35 35L20 15L50 30L80 15L65 35L90 45L65 55L80 75L50 65Z" />
        <path d="M50 65L35 85L45 65L50 65ZM50 65L65 85L55 65L50 65Z" />
        <path d="M50 30L50 5L45 25L50 30ZM50 30L50 5L55 25L50 30Z" />
      </motion.svg>
      
      {/* Subtle glow trail */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500/20 rounded-full blur-md"
        animate={{
          scale: isPointer ? 2.5 : 1,
        }}
      />
    </motion.div>
  );
}
