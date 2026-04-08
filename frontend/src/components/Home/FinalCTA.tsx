import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const FinalCTA = ({ onStart }: { onStart: () => void }) => {
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && ctaRef.current) {
        gsap.fromTo(ctaRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }
        );
        observer.unobserve(entries[0].target);
      }
    }, { threshold: 0.3 });

    if (ctaRef.current) observer.observe(ctaRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="w-full pt-32 pb-16 px-6 lg:px-12 bg-void flex items-center justify-center">
      <div 
        ref={ctaRef}
        className="w-full max-w-5xl rounded-[3rem] p-12 md:p-20 text-center flex flex-col items-center gap-8 relative overflow-hidden bg-gradient-to-br border border-gold/30"
        style={{
          background: 'linear-gradient(135deg, #1A1612 0%, #080808 100%)'
        }}
      >
        {/* Subtle inner noise for texture */}
        <div className="absolute inset-0 opacity-10 mix-blend-overlay" />
        
        <h2 className="font-display font-extrabold text-[clamp(3rem,6vw,5rem)] text-gold leading-[1.05] relative z-10 max-w-3xl drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]">
          Your next interview is closer than you think.
        </h2>
        
        <p className="font-body text-xl text-ivory opacity-90 font-medium relative z-10">
          Start a free session. No signup required.
        </p>

        <button 
          onClick={onStart}
          className="relative z-10 group bg-gold text-void px-10 py-5 rounded-full font-heading text-lg font-bold hover:shadow-[0_0_30px_rgba(201,168,76,0.5)] transition-all duration-300 hover:scale-105 btn-magnetic"
        >
          <span className="group-hover:text-gold-light transition-colors">Begin Interview Now</span>
        </button>
      </div>
    </section>
  );
};
