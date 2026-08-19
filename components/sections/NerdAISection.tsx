'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Cpu, Zap, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import LoginPage from '@/components/nerdai/LoginPage';
import ChatInterface from '@/components/nerdai/ChatInterface';
import AdminPanel from '@/components/nerdai/AdminPanel';
import { getCurrentSession, logout } from '@/lib/nerdai/auth';
import type { AuthSession } from '@/lib/nerdai/types';

type View = 'landing' | 'login' | 'chat' | 'admin';

interface Particle {
  id: number;
  x: string;
  y: string;
  ax: string;
  ay: string;
  size: number;
  duration: number;
  delay: number;
}

export default function NerdAISection({ onBack }: { onBack?: () => void }) {
  // NerdAISection is only ever mounted client-side (rendered after user navigation),
  // so lazy initialisers with Math.random and localStorage are safe here.
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      ax: `${Math.random() * 100}%`,
      ay: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 5 + 4,
      delay: Math.random() * 4,
    }))
  );
  const [session, setSession] = useState<AuthSession | null>(() => getCurrentSession());
  const [view, setView] = useState<View>(() => (getCurrentSession() ? 'chat' : 'landing'));

  const handleLogin = (s: AuthSession) => {
    setSession(s);
    setView('chat');
  };

  const handleLogout = () => {
    logout();
    setSession(null);
    setView('landing');
  };

  const handleEnterNerdAI = () => {
    const existing = getCurrentSession();
    if (existing) {
      setSession(existing);
      setView('chat');
    } else {
      setView('login');
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black/80 backdrop-blur-[2px]">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Particle background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {particles.map(p => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-red-600/30"
                  style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
                  animate={{
                    left: [p.x, p.ax, p.x],
                    top: [p.y, p.ay, p.y],
                    opacity: [0, 0.6, 0],
                  }}
                  transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>

            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Back to Portfolio */}
            {onBack && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={onBack}
                className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 bg-black/50 border border-white/10 hover:border-red-800/60 rounded-xl text-gray-500 hover:text-white text-xs tracking-widest uppercase transition-all backdrop-blur-sm z-20"
              >
                <ArrowLeft size={13} />
                <span>PORTFOLIO</span>
              </motion.button>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
              {/* Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="mb-6"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(220,38,38,0.3)',
                      '0 0 50px rgba(220,38,38,0.6)',
                      '0 0 20px rgba(220,38,38,0.3)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="w-24 h-24 rounded-3xl bg-red-600/10 border border-red-800/50 flex items-center justify-center mx-auto"
                >
                  <Brain className="text-red-500" size={44} />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-6xl md:text-9xl font-bold tracking-widest mb-3"
              >
                <span className="text-white">NERD</span>
                <span className="text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">AI</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-gray-500 text-sm md:text-base tracking-[0.4em] uppercase mb-10"
              >
                Powered By Advanced AI Models
              </motion.p>

              {/* Feature cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="grid grid-cols-3 gap-4 mb-10 w-full max-w-lg"
              >
                {[
                  { icon: Cpu, label: 'Multi-Model', desc: 'Bedrock, Azure, OpenAI, Gemini' },
                  { icon: Lock, label: 'Secure', desc: 'Role-based access control' },
                  { icon: Zap, label: 'Intelligent', desc: 'Streaming responses' },
                ].map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="bg-zinc-950/80 backdrop-blur-sm border border-white/5 hover:border-red-800/40 rounded-2xl p-3 flex flex-col items-center gap-2 transition-all group"
                  >
                    <f.icon size={18} className="text-red-500/70 group-hover:text-red-500 transition-colors" />
                    <span className="text-white text-xs font-semibold tracking-wider">{f.label}</span>
                    <span className="text-gray-600 text-[10px] tracking-wide leading-tight text-center">{f.desc}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                onClick={handleEnterNerdAI}
                className="group relative px-10 py-4 bg-red-600/80 hover:bg-red-600 text-white tracking-widest font-bold rounded-2xl overflow-hidden transition-all flex items-center gap-3 text-sm shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.5)]"
              >
                <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Brain size={18} className="relative z-10" />
                <span className="relative z-10">ENTER NERDAI</span>
                <ChevronRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full relative"
          >
            {onBack && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={onBack}
                className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 bg-black/50 border border-white/10 hover:border-red-800/60 rounded-xl text-gray-500 hover:text-white text-xs tracking-widest uppercase transition-all backdrop-blur-sm z-20"
              >
                <ArrowLeft size={13} />
                <span>PORTFOLIO</span>
              </motion.button>
            )}
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        )}

        {view === 'chat' && session && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <ChatInterface
              session={session}
              onLogout={handleLogout}
              onAdminPanel={() => setView('admin')}
              onBack={onBack}
            />
          </motion.div>
        )}

        {view === 'admin' && session && (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <AdminPanel session={session} onBack={() => setView('chat')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
