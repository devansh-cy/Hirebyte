import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const PhilosophySection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Word-by-word reveal manually implemented via IntersectionObserver because ScrollTrigger is not used strictly here
    // or we can use IntersectionObserver to just reveal lines.
    const textLines = containerRef.current?.querySelectorAll('.reveal-line');
    if (!textLines) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.fromTo(entry.target,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }
          );
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 }); // High threshold so it triggers when fully in view

    textLines.forEach(line => observer.observe(line));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="w-full py-40 px-6 lg:px-12 bg-void relative overflow-hidden" ref={containerRef}>
      {/* Parallax Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{
             backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(201,168,76,0.15) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}
      />
      
      <div className="max-w-4xl mx-auto flex flex-col gap-12 text-center relative z-10">
        
        <p className="reveal-line opacity-0 font-body text-muted text-base md:text-lg">
          Most interview prep gives you questions to memorize.
        </p>
        
        <h2 className="reveal-line opacity-0 font-display italic text-ivory text-[clamp(2.5rem,5vw,4.5rem)] leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          We put you in the room.
        </h2>
        
        <p className="reveal-line opacity-0 font-body text-[#7A6A53] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          The AI doesn't read from a list. It listens, adapts, and pushes back — 
          the same way a real interviewer does.
        </p>
        
        <h3 className="reveal-line opacity-0 font-display italic text-gold drop-shadow-[0_0_15px_rgba(201,168,76,0.6)] text-[clamp(2rem,4vw,3.5rem)] mt-8 leading-none">
          Your anxiety is data. We measure it.
        </h3>

      </div>
    </section>
  );
};
