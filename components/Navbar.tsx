'use client';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = ['Home', 'About', 'Projects', 'Certifications', 'Contact'];

export default function Navbar({ activeSection, onNavigate }: { activeSection: string, onNavigate: (s: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="fixed top-0 left-0 w-full z-40 px-6 py-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm"
    >
      <div className="text-2xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
        SOUMIK
      </div>
      <div className="hidden md:flex space-x-8">
        {navItems.map(item => (
          <button
            key={item}
            onClick={() => onNavigate(item)}
            className={`text-sm tracking-widest uppercase transition-all duration-300 hover:text-red-500 hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] ${activeSection === item ? 'text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'text-gray-300'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-black/90 backdrop-blur-md flex flex-col items-center py-4 space-y-4 md:hidden border-t border-white/10"
          >
            {navItems.map(item => (
              <button
                key={item}
                onClick={() => { onNavigate(item); setIsOpen(false); }}
                className={`text-sm tracking-widest uppercase transition-all duration-300 ${activeSection === item ? 'text-red-500' : 'text-gray-300'}`}
              >
                {item}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
