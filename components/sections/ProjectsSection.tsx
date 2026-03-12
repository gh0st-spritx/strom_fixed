'use client';
import { motion } from 'motion/react';

const projects = [
  {
    title: "Market Alert Bot",
    tech: "Python",
    desc: "AI-prototyped real-time price tracker."
  },
  {
    title: "Data Scraper Utility",
    tech: "Python",
    desc: "AI-prototyped tool for automated Telegram data extraction."
  },
  {
    title: "Tic-Tac-Toe Game",
    tech: "C",
    desc: "Classic console-based game implementation."
  }
];

export default function ProjectsSection() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 md:px-20 max-w-6xl mx-auto py-12 relative">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold mb-16 text-red-600 tracking-[0.3em] text-center drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] uppercase"
      >
        PROJECTS
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {projects.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            className="relative bg-zinc-950/80 backdrop-blur-sm border-2 border-red-900/30 rounded-2xl p-8 hover:border-red-500 transition-all group overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          >
            {/* Slash Effect on Hover */}
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
              <div className="absolute top-1/2 left-1/2 w-[150%] h-[2px] bg-red-500 shadow-[0_0_10px_red] -translate-x-1/2 -translate-y-1/2 -rotate-45 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out opacity-0 group-hover:opacity-70" />
            </div>

            {/* Blood Drip Effect on Hover */}
            <svg className="absolute top-0 left-0 w-full h-16 text-red-700/60 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-full group-hover:translate-y-0 pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L100,0 L100,10 Q90,40 80,10 Q70,60 60,15 Q50,80 40,20 Q30,50 20,10 Q10,70 0,10 Z" />
            </svg>

            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">{p.title}</h3>
              <div className="text-xs tracking-[0.2em] text-red-600 mb-6 uppercase border-b border-red-900/50 pb-2 inline-block">{p.tech}</div>
              <p className="text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
