'use client';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image'; // <-- Added this import

const certs = [
  { 
    name: "IELTS Band 7", 
    link: "/ielts.pdf",
    desc: "Demonstrated high proficiency in English language skills, including listening, reading, writing, and speaking.",
    logo: "/ielts.png"
  },
  { 
    name: "CompTIA ITF+", 
    link: "https://www.credly.com/badges/68e47d7c-0fbc-4641-99ba-014990668bde/public_url",
    desc: "Certified in foundational IT concepts, infrastructure, software development, and database fundamentals.",
    logo: "/itf_logo.png"
  },
  { 
    name: "Google AI Professional", 
    link: "/ai.pdf",
    desc: "Specialized in advanced prompt engineering, LLM interaction, and AI-driven rapid prototyping.",
    logo: "/ai.png"
  }
];

export default function CertificationsSection() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 md:px-20 max-w-5xl mx-auto py-12 relative">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-5xl font-bold mb-16 text-red-600 tracking-[0.3em] text-center drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] uppercase"
      >
        CERTIFICATIONS
      </motion.h2>

      <div className="flex flex-col space-y-8 w-full">
        {certs.map((c, i) => (
          <motion.a
            key={i}
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: i * 0.2, type: "spring", stiffness: 100 }}
            className="relative flex flex-col md:flex-row items-center bg-zinc-950/90 border-2 border-red-900/30 border-l-8 border-l-red-700 rounded-2xl p-6 md:p-8 hover:bg-zinc-900 hover:border-red-700/50 transition-all group overflow-hidden shadow-lg"
          >
            {/* Blood Splatter Effect (SVG) */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-0 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none translate-x-8 -translate-y-8">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="fill-red-600">
                <path d="M45.7,-76.3C58.9,-69.3,69.1,-55.3,76.5,-40.5C83.9,-25.7,88.5,-10.1,86.1,4.5C83.7,19.1,74.3,32.7,64.2,44.7C54.1,56.7,43.3,67.1,30.3,74.1C17.3,81.1,2.1,84.7,-12.3,82.5C-26.7,80.3,-40.3,72.3,-52.1,61.9C-63.9,51.5,-73.9,38.7,-79.8,23.8C-85.7,8.9,-87.5,-8.1,-82.4,-23.4C-77.3,-38.7,-65.3,-52.3,-51.5,-59.5C-37.7,-66.7,-22.1,-67.5,-5.8,-60.6C10.5,-53.7,32.5,-83.3,45.7,-76.3Z" transform="translate(100 100) scale(1.1)" />
                <circle cx="150" cy="150" r="15" />
                <circle cx="40" cy="160" r="10" />
                <circle cx="170" cy="60" r="8" />
              </svg>
            </div>

            {/* Logo Placeholder */}
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-black/50 border border-red-900/30 rounded-xl flex items-center justify-center mb-6 md:mb-0 md:mr-8 relative group-hover:border-red-500/50 transition-colors overflow-hidden shadow-[inset_0_0_20px_rgba(220,38,38,0.1)] group-hover:shadow-[inset_0_0_30px_rgba(220,38,38,0.3)]">
              {c.logo ? (
                /* Swapped <img> for <Image /> and added the fill property */
                <Image 
                  src={c.logo} 
                  alt={`${c.name} logo`} 
                  fill 
                  className="object-contain p-2 relative z-10" 
                />
              ) : (
                <span className="text-red-900/50 text-xs tracking-widest uppercase text-center px-2 relative z-10">Logo<br/>Here</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left relative z-10">
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors flex items-center justify-center md:justify-start gap-3">
                {c.name}
                <ExternalLink size={18} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                {c.desc}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
