'use client';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { KeyRound, User, LogIn, Cpu } from 'lucide-react';
import { login } from '@/lib/nerdai/auth';
import type { AuthSession } from '@/lib/nerdai/types';

interface Particle {
  id: number;
  x: string;
  y: string;
  ax: string;
  duration: number;
  delay: number;
  size: number;
}

export default function LoginPage({ onLogin }: { onLogin: (session: AuthSession) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const ps: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      ax: `${Math.random() * 100}%`,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
      size: Math.random() * 3 + 1,
    }));
    setParticles(ps);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const session = await login(username.trim(), password);
      if (!session) {
        setError('Invalid credentials. Access denied.');
      } else {
        onLogin(session);
      }
    } catch {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent">
      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-red-600/40"
            style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
            animate={{ x: [0, 20, -20, 0], y: [0, -30, 10, 0], opacity: [0, 0.8, 0.4, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="bg-black/50 backdrop-blur-xl border border-red-800/50 rounded-3xl p-8 shadow-[0_0_60px_rgba(220,38,38,0.15)]">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600/10 border border-red-800/50 mb-4"
              animate={{ boxShadow: ['0 0 10px rgba(220,38,38,0.3)', '0 0 25px rgba(220,38,38,0.6)', '0 0 10px rgba(220,38,38,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Cpu className="text-red-500" size={28} />
            </motion.div>
            <h1 className="text-4xl font-bold tracking-widest mb-1">
              <span className="text-white">NERD</span>
              <span className="text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">AI</span>
            </h1>
            <p className="text-gray-500 text-xs tracking-[0.3em] uppercase">Intelligent Interface</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black/60 border border-white/10 focus:border-red-600/70 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 outline-none transition-all duration-300 tracking-wider text-sm"
                autoComplete="username"
              />
            </div>

            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/60 border border-white/10 focus:border-red-600/70 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 outline-none transition-all duration-300 tracking-wider text-sm"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center tracking-wide bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full relative bg-red-600/80 hover:bg-red-600 disabled:bg-red-900/30 disabled:cursor-not-allowed text-white tracking-widest font-semibold rounded-xl py-3 transition-all duration-300 flex items-center justify-center gap-2 group overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <LogIn size={18} />
                    ENTER
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-xs mt-6 tracking-wider">
            Secure AI Interface by Soumik Halder
          </p>
        </div>
      </motion.div>
    </div>
  );
}
