import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowDown } from 'lucide-react';

export const LandingHero = ({ onStart }: { onStart: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Page Load Sequence
    const tl = gsap.timeline();

    // Reset initial states
    gsap.set(textRef.current?.children || [], { opacity: 0, y: 50 });

    tl.to(document.body, { opacity: 1, duration: 0.1 })
      .to(textRef.current?.children || [], {
        opacity: 1,
        y: 0,
        stagger: 0.12,
        ease: 'power3.out',
        duration: 1,
        delay: 0.6 // Wait for overlay to "slide up" if we had one
      });

  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-screen min-h-[800px] flex items-end pb-20 pl-8 md:pl-16 lg:pl-24 overflow-hidden"
    >
      
      {/* Heavy radial gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.15) 0%, transparent 60%), 
            radial-gradient(ellipse at 70% 50%, rgba(201,168,76,0.1) 0%, transparent 60%)
          `
        }}
      />

      {/* Content */}
      <div ref={textRef} className="relative z-10 w-full max-w-5xl flex flex-col gap-6">
        <h2 className="font-heading text-muted uppercase tracking-[0.2em] text-[clamp(1.2rem,4vw,2rem)] font-semibold">
          AI INTERVIEW PLATFORM
        </h2>
        
        <h1 className="font-display font-extrabold text-ivory text-[clamp(3.5rem,8vw,7rem)] leading-[1.1]">
          Train like you're
        </h1>
        
        <h1 className="font-display italic text-gold drop-shadow-[0_0_20px_rgba(201,168,76,0.5)] text-[clamp(3.5rem,8vw,7rem)] leading-[0.9]">
          already hired.
        </h1>
        
        <p className="font-body text-[#7A6A53] text-lg md:text-xl max-w-[480px] leading-[1.7] mt-4">
          HireByte simulates real interviews. Live AI questioning. 
          Real-time confidence scoring. A full RIPIS report when you finish.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-8">
          <button 
            onClick={onStart}
            className="group relative bg-gold text-void hover:bg-gold-light transition-all duration-300 shadow-[0_0_20px_rgba(201,168,76,0.2)] hover:shadow-[0_0_40px_rgba(201,168,76,0.5)] hover:scale-105 px-8 py-4 rounded-full font-heading font-semibold text-lg btn-magnetic"
          >
            Start Your Free Interview
          </button>
          
          <button 
            onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-gold font-heading hover:text-gold-light hover:drop-shadow-[0_0_8px_rgba(201,168,76,0.8)] transition-all drop-shadow-[0_0_4px_rgba(201,168,76,0.3)]"
          >
            See how it works <ArrowDown size={18} className="animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};
