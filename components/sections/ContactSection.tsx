'use client';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Globe, Linkedin, Github, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const FiverrIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 4h-3a3 3 0 0 0-3 3v10" />
    <path d="M7 11h6" />
    <circle cx="15" cy="5" r="1" fill="currentColor" />
  </svg>
);

export default function ContactSection() {
  const [isDrawn, setIsDrawn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsDrawn(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 md:px-20 max-w-5xl mx-auto py-12 relative overflow-hidden">
      {/* Ink Drop Background Effect */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: isDrawn ? 1 : 0, opacity: isDrawn ? 0.1 : 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold mb-16 text-red-600 tracking-[0.3em] text-center drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] uppercase relative z-10"
      >
        CONTACT
      </motion.h2>

      <motion.div 
        initial={{ opacity: 0, clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)' }}
        animate={{ opacity: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
        transition={{ duration: 0.8, ease: "circOut", delay: 0.2 }}
        className="relative bg-zinc-950/90 backdrop-blur-md border-t-2 border-b-2 border-red-800 p-8 md:p-12 w-full flex flex-col md:flex-row gap-12 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
      >
        {/* Sword Slice Divider */}
        <motion.div 
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="hidden md:block absolute top-8 bottom-8 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-red-600 to-transparent origin-top"
        />

        <div className="flex-1 space-y-8 relative z-10">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-bold text-white mb-8 tracking-widest uppercase flex items-center gap-3"
          >
            <span className="w-3 h-3 bg-red-600 rotate-45" /> Get In Touch
          </motion.h3>
          
          <div className="space-y-6">
            {[
              { icon: Phone, text: "+88 01553425102" },
              { icon: Mail, text: "soumikhalder.edu@gmail.com" },
              { icon: MapPin, text: "Bashundhara Residential Area" },
              { icon: Globe, text: "soumik.me", link: "http://soumik.me" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + (i * 0.1) }}
                className="flex items-center space-x-6 text-gray-300 group"
              >
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded group-hover:bg-red-600 group-hover:border-red-500 transition-colors">
                  <item.icon className="text-red-500 group-hover:text-white transition-colors" size={20} />
                </div>
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-lg hover:text-red-400 transition-colors tracking-wide">{item.text}</a>
                ) : (
                  <span className="text-lg tracking-wide">{item.text}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center md:items-start space-y-8 relative z-10 pt-8 md:pt-0 md:pl-12">
          <motion.h3 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-bold text-white mb-4 tracking-widest uppercase flex items-center gap-3"
          >
            <span className="w-3 h-3 bg-red-600 rotate-45" /> Social Profiles
          </motion.h3>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-wrap gap-4"
          >
            {[
              { icon: Linkedin, link: "https://www.linkedin.com/in/soumik-halder-spritx/" },
              { icon: Github, link: "https://github.com/gh0st-spritx" },
              { icon: Twitter, link: "#" },
              { icon: Facebook, link: "https://www.facebook.com/soumikhalderop/" },
              { icon: MessageCircle, link: "http://wa.me/+8801553425102" }, // WhatsApp
              { icon: FiverrIcon, link: "https://www.fiverr.com/s/zWEZDqE" }
            ].map((social, i) => (
              <a 
                key={i}
                href={social.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative p-4 bg-black/50 border border-red-900/50 hover:border-red-500 hover:bg-red-950/50 transition-all text-gray-400 hover:text-white group overflow-hidden rounded-lg"
              >
                <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <social.icon size={24} className="relative z-10" />
              </a>
            ))}
          </motion.div>

          <motion.a 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4 }}
            href="/Resume_f.pdf" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mt-12 relative inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white font-bold tracking-[0.2em] uppercase overflow-hidden group"
          >
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            <span className="relative flex items-center gap-2">
              DOWNLOAD RESUME
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </span>
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}
