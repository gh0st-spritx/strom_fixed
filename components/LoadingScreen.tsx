'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const weapons = [
  <svg key="1" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>,
  <svg key="2" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2L15 10L13 12V18C13 19.1 12.1 20 11 20C9.9 20 9 19.1 9 18V12L7 10L12 2ZM11 22C11.6 22 12 21.6 12 21C12 20.4 11.6 20 11 20C10.4 20 10 20.4 10 21C10 21.6 10.4 22 11 22Z"/></svg>,
  <svg key="3" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 1L13.5 8.5L21 7L15.5 12L21 17L13.5 15.5L12 23L10.5 15.5L3 17L8.5 12L3 7L10.5 8.5L12 1Z"/></svg>,
  <svg key="4" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M11 2L13 2L13 22L11 22L11 2Z"/></svg>,
  <svg key="5" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M5 2V22H7V12H15C17.2 12 19 10.2 19 8C19 5.8 17.2 4 15 4H7V2H5ZM7 6H15C16.1 6 17 6.9 17 8C17 9.1 16.1 10 15 10H7V6Z"/></svg>
];

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsLoaded(true);
          return 100;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
      <div className="w-64 relative h-12">
        <div className="absolute top-0 left-0 w-full flex justify-between px-2">
          {weapons.map((Weapon, i) => {
            const weaponProgress = i * 25;
            const isActive = progress >= weaponProgress;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0.3, y: 0, rotate: 0 }}
                animate={{ 
                  opacity: isActive ? 1 : 0.3, 
                  y: isActive ? -10 : 0,
                  rotate: isActive ? 360 : 0
                }}
                transition={{ duration: 0.5 }}
                className={`text-red-600 ${isActive ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''}`}
              >
                {Weapon}
              </motion.div>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800 rounded overflow-hidden mt-8">
          <motion.div 
            className="h-full bg-red-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="mt-12 h-12 flex items-center justify-center">
        {isLoaded ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1, textShadow: "0px 0px 8px rgb(220,38,38)" }}
            onClick={onComplete}
            className="text-red-600 tracking-[0.4em] uppercase text-lg font-bold border border-red-600/50 px-8 py-2 rounded hover:bg-red-950/30 transition-all"
          >
            ENTER
          </motion.button>
        ) : (
          <motion.div 
            className="text-red-600 tracking-[0.3em] uppercase text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Loading...
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
