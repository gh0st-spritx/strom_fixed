'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

type Particle = {
  id: number;
  initialX: string;
  animateX: string;
  scale: number;
  duration: number;
  delay: number;
};

export default function AboutSection() {
  const [showContent, setShowContent] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate random values for particles only on the client side
    const generatedParticles: Particle[] = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      initialX: `${Math.random() * 100}%`,
      animateX: `${Math.random() * 100}%`,
      scale: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }));
    
    // Defer the state update to avoid synchronous setState warnings in Next.js 15
    const particleTimer = setTimeout(() => setParticles(generatedParticles), 0);
    const contentTimer = setTimeout(() => setShowContent(true), 800);
    
    return () => {
      clearTimeout(particleTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 md:px-20 max-w-5xl mx-auto py-12 relative overflow-hidden">
      {/* Fire/Ember Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-orange-500 rounded-full blur-[1px]"
            initial={{ 
              y: '100%', 
              x: particle.initialX,
              opacity: 0 
            }}
            animate={{ 
              y: '-10%', 
              x: particle.animateX,
              opacity: [0, 1, 0],
              scale: [1, particle.scale, 1]
            }}
            transition={{ 
              duration: particle.duration, 
              repeat: Infinity, 
              delay: particle.delay 
            }}
          />
        ))}
      </div>

      {/* Katana Slash Animation */}
      <motion.div
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.6, ease: "circIn" }}
        className="absolute top-1/2 left-0 w-full h-1 bg-red-500 shadow-[0_0_20px_rgba(220,38,38,1)] origin-left z-50 pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, filter: 'blur(10px)' }}
        animate={{ opacity: showContent ? 1 : 0, filter: showContent ? 'blur(0px)' : 'blur(10px)' }}
        transition={{ duration: 0.8 }}
        className="relative bg-zinc-950/80 backdrop-blur-md border-2 border-red-800/50 rounded-3xl p-8 md:p-12 text-center w-full shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Bottom Fire Glow */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-red-900/40 to-transparent pointer-events-none" />

        <h2 className="text-3xl md:text-5xl font-bold mb-8 text-red-600 tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] relative z-10">
          ABOUT ME
        </h2>
        
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 relative z-10">
          AI prompt engineer and certified AI professional specializing in advanced prompt optimization and LLM interaction. Skilled at designing structured prompts, synthesizing data insights, and creating high-quality AI-generated content. Proven ability to develop evaluation criteria and meet deadlines in independent research settings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left mt-12 relative z-10">
          <div className="relative p-6 bg-black/40 border border-red-900/30 rounded-2xl hover:border-red-600/50 transition-colors group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-2xl font-bold text-white mb-6 border-b border-red-800/50 pb-2 flex items-center gap-3">
              <span className="w-2 h-2 bg-red-600 rotate-45 rounded-sm" /> Education
            </h3>
            <ul className="space-y-6 text-gray-400">
              <li className="relative pl-4 border-l border-red-900/50">
                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-red-600" />
                <div className="text-white font-semibold tracking-wider">BSC in CSE</div>
                <div className="text-sm text-red-400/80">North South University (2025 - Ongoing)</div>
              </li>
              <li className="relative pl-4 border-l border-red-900/50">
                <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-red-600" />
                <div className="text-white font-semibold tracking-wider">HSC in Science</div>
                <div className="text-sm text-red-400/80">Sunarban Adarsha College (2022 - 2024)</div>
                <div className="text-xs text-gray-500 mt-1">GPA 5.00/5.00</div>
              </li>
            </ul>
          </div>

          <div className="relative p-6 bg-black/40 border border-red-900/30 rounded-2xl hover:border-red-600/50 transition-colors group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-2xl font-bold text-white mb-6 border-b border-red-800/50 pb-2 flex items-center gap-3">
              <span className="w-2 h-2 bg-red-600 rotate-45 rounded-sm" /> Skills
            </h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">▹</span>
                <div><span className="text-white font-medium">AI:</span> Advanced Prompt Engineering, LLM Interaction, AI Data Analysis</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">▹</span>
                <div><span className="text-white font-medium">Programming:</span> C, Python, Rapid Prototyping</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">▹</span>
                <div><span className="text-white font-medium">IT & Security:</span> Linux (Debian, Kali, Arch), Network Reconnaissance</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">▹</span>
                <div><span className="text-white font-medium">Multimedia:</span> DaVinci Resolve Studio, Adobe Premiere Pro</div>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
