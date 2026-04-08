import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { useAnimation } from '../../context/AnimationContext';
import gsap from 'gsap';

export const Navbar = ({ onLoginClick }: { onLoginClick: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { showContent } = useAnimation();
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Magnetic Button Effect
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    
    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, { x: x * 0.25, y: y * 0.25, duration: 0.4, ease: 'power2.out' });
    };
    
    const onMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <>
      <nav
        className={`fixed left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 ease-out px-6 py-3 rounded-full flex items-center justify-between w-[90%] max-w-5xl ${
          isScrolled 
            ? 'top-4 backdrop-blur-2xl bg-[#080808]/85 border border-gold/15' 
            : 'top-6 bg-transparent border-transparent'
        }`}
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translate(-50%, var(--tw-translate-y))' : 'translate(-50%, -20px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-display text-gold font-bold text-2xl tracking-tight">HireByte</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-heading font-semibold text-muted">
          <a href="#features" className="hover:text-gold transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gold transition-colors">How It Works</a>
          <a href="#analytics" className="hover:text-gold transition-colors">Analytics</a>
          <a href="#pricing" className="hover:text-gold transition-colors">Pricing</a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button 
            ref={ctaRef}
            onClick={onLoginClick}
            className="hidden md:flex items-center justify-center bg-gold text-void hover:bg-gold-light hover:scale-105 transition-all duration-300 px-6 py-2 rounded-full font-heading font-semibold text-sm tracking-wide shadow-[0_0_20px_rgba(201,168,76,0.2)]"
          >
            Start Practicing
          </button>
          <button
            className="md:hidden text-gold p-2 hover:bg-gold/10 rounded-full transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-void/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-8 text-xl font-display text-ivory">
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How It Works</a>
            <a href="#analytics" onClick={() => setIsMenuOpen(false)}>Analytics</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <button 
              onClick={() => { setIsMenuOpen(false); onLoginClick(); }}
              className="bg-gold text-void px-8 py-3 rounded-full font-heading font-semibold mt-4 shadow-[0_0_20px_rgba(201,168,76,0.2)]"
            >
              START PRACTICING
            </button>
          </div>
        </div>
      )}
    </>
  );
};
