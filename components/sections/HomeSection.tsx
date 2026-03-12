'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function HomeSection({ onNavigate }: { onNavigate: (s: string) => void }) {
  const fullText = "AI PROMPT ENGINEER & DEVELOPER";
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);
    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h1 className="text-5xl md:text-8xl font-bold tracking-widest mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          SOUMIK HALDER
        </h1>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="h-8 mb-8"
      >
        <p className="text-xl md:text-3xl text-red-500 tracking-[0.2em] font-light drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
          {typedText}
          <motion.span 
            animate={{ opacity: [1, 0] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-1 h-6 md:h-8 bg-red-500 ml-1 align-middle"
          />
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="text-gray-300 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
      >
        Specializing in advanced prompt optimization, LLM interaction, and rapid software prototyping. I bridge the gap between complex AI models and robust, real-world applications.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2 }}
        className="flex flex-col sm:flex-row gap-6"
      >
        <button 
          onClick={() => onNavigate('Projects')}
          className="group relative px-8 py-3 bg-red-600/80 hover:bg-red-600 text-white tracking-widest font-semibold rounded overflow-hidden transition-all flex items-center justify-center gap-2"
        >
          <span className="relative z-10">VIEW PROJECTS</span>
          <ChevronRight className="relative z-10 group-hover:translate-x-1 transition-transform" size={20} />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        </button>
        
        <button 
          onClick={() => onNavigate('Contact')}
          className="px-8 py-3 bg-transparent border border-white/30 hover:border-white hover:bg-white/5 text-white tracking-widest font-semibold rounded transition-all"
        >
          CONTACT ME
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
        className="mt-16 grid grid-cols-3 gap-8 md:gap-16 border-t border-white/10 pt-8"
      >
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-white mb-2">AI</span>
          <span className="text-xs text-red-500 tracking-widest uppercase">Prompt Eng.</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-white mb-2">Py/C</span>
          <span className="text-xs text-red-500 tracking-widest uppercase">Development</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-white mb-2">Data</span>
          <span className="text-xs text-red-500 tracking-widest uppercase">Analysis</span>
        </div>
      </motion.div>
    </div>
  );
}
