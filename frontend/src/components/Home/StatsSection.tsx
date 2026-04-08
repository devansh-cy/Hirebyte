import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const StatsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stats = containerRef.current?.querySelectorAll('.stat-number');
    if (!stats) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        stats.forEach((stat) => {
          const target = parseFloat(stat.getAttribute('data-target') || '0');
          const isK = stat.getAttribute('data-target')?.includes('K');
          const isM = stat.getAttribute('data-target')?.includes('M');
          const isPercent = stat.getAttribute('data-target')?.includes('%');
          const isRating = stat.getAttribute('data-target')?.includes('★');
          
          const duration = 2; // Fixed 2 second count up
          
          gsap.to(stat, {
            innerHTML: target,
            duration: duration,
            snap: { innerHTML: isRating ? 0.1 : 1 },
            ease: "power2.out",
            onUpdate: function() {
              let val = this.targets()[0].innerHTML;
              if (isK) val += 'K+';
              else if (isM) val += 'M';
              else if (isPercent) val += '%';
              else if (isRating) val += ' ★';
              else val += '+';
              stat.innerHTML = val;
            }
          });
        });
        
        observer.unobserve(entries[0].target);
      }
    }, { threshold: 0.5 });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="w-full py-20 px-6 lg:px-12 bg-void overflow-hidden border-y border-gold/10" ref={containerRef}>
      <div id="analytics" className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
          
          <div className="flex flex-col gap-2">
            <span className="stat-number font-display font-extrabold text-[clamp(3.5rem,6vw,6rem)] leading-none text-gold drop-shadow-[0_0_15px_rgba(201,168,76,0.4)]" data-target="10">0</span>
            <span className="font-heading font-semibold text-sm uppercase tracking-widest text-[#7A6A53]">Interviews Completed</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="stat-number font-display font-extrabold text-[clamp(3.5rem,6vw,6rem)] leading-none text-gold drop-shadow-[0_0_15px_rgba(201,168,76,0.4)]" data-target="94%">0</span>
            <span className="font-heading font-semibold text-sm uppercase tracking-widest text-[#7A6A53]">Confidence Improvement</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="stat-number font-display font-extrabold text-[clamp(3.5rem,6vw,6rem)] leading-none text-gold drop-shadow-[0_0_15px_rgba(201,168,76,0.4)]" data-target="4.8★">0</span>
            <span className="font-heading font-semibold text-sm uppercase tracking-widest text-[#7A6A53]">Average User Rating</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="stat-number font-display font-extrabold text-[clamp(3.5rem,6vw,6rem)] leading-none text-gold drop-shadow-[0_0_15px_rgba(201,168,76,0.4)]" data-target="2.3M">0</span>
            <span className="font-heading font-semibold text-sm uppercase tracking-widest text-[#7A6A53]">Questions Answered</span>
          </div>

        </div>
      </div>
    </section>
  );
};
