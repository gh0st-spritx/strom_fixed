'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import RainEffect from '@/components/RainEffect';
import LightningStrike from '@/components/LightningStrike';
import MusicToggle from '@/components/MusicToggle';
import CustomCursor from '@/components/CustomCursor';
import HomeSection from '@/components/sections/HomeSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import CertificationsSection from '@/components/sections/CertificationsSection';
import ContactSection from '@/components/sections/ContactSection';

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('Home');
  const [lightningTrigger, setLightningTrigger] = useState(0);
  const [displaySection, setDisplaySection] = useState('Home');

  const handleNavigate = (section: string) => {
    if (section === activeSection) return;
    setActiveSection(section);
    setLightningTrigger(prev => prev + 1);
  };

  const handleLightningComplete = () => {
    setDisplaySection(activeSection);
  };

  const renderSection = () => {
    switch (displaySection) {
      case 'Home': return <HomeSection onNavigate={handleNavigate} />;
      case 'About': return <AboutSection />;
      case 'Projects': return <ProjectsSection />;
      case 'Certifications': return <CertificationsSection />;
      case 'Contact': return <ContactSection />;
      default: return <HomeSection onNavigate={handleNavigate} />;
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <>
          {/* Background Video */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
          >
            <source src="/strom.mp4" type="video/mp4" />
          </video>

          {/* Global Effects */}
          <CustomCursor />
          <RainEffect />
          <LightningStrike trigger={lightningTrigger} onComplete={handleLightningComplete} />
          
          {/* UI Elements */}
          <Navbar activeSection={activeSection} onNavigate={handleNavigate} />
          <MusicToggle />

          {/* Main Content Area */}
          <div className="relative z-20 w-full h-full pt-24 pb-12 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={displaySection}
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.5 }}
                className="min-h-full"
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </main>
  );
}
