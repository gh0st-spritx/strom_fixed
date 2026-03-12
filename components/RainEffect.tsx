'use client';
import { useEffect, useRef } from 'react';

export default function RainEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const drops: { x: number; y: number; length: number; speed: number; opacity: number }[] = [];
    for (let i = 0; i < 150; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 10 + 15,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * 0.2, drop.y + drop.length);
        ctx.strokeStyle = `rgba(255, 255, 255, ${drop.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= drop.speed * 0.2;

        if (drop.y > height) {
          drop.y = -drop.length;
          drop.x = Math.random() * width;
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 opacity-60"
    />
  );
}
