'use client';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

export default function LightningStrike({ trigger, onComplete }: { trigger: number, onComplete?: () => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      const showTimer = setTimeout(() => setShow(true), 0);
      const hideTimer = setTimeout(() => {
        setShow(false);
        if (onComplete) onComplete();
      }, 500);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [trigger, onComplete]);

  useEffect(() => {
    const randomLightning = () => {
      if (Math.random() > 0.7) {
        setShow(true);
        setTimeout(() => setShow(false), 150 + Math.random() * 200);
      }
      setTimeout(randomLightning, 5000 + Math.random() * 10000);
    };
    const timer = setTimeout(randomLightning, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.2, 0.8, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-white z-50 pointer-events-none mix-blend-overlay"
        />
      )}
    </AnimatePresence>
  );
}
