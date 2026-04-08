import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    // Scroll reveal
    const steps = containerRef.current?.querySelectorAll('.step-item');
    if (!steps || !lineRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        // Draw the line
        gsap.fromTo(lineRef.current, 
          { strokeDashoffset: 1000 },
          { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" }
        );
        
        // Reveal steps
        gsap.fromTo(steps,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.4, ease: "power2.out", delay: 0.5 }
        );
        
        observer.unobserve(entries[0].target);
      }
    }, { threshold: 0.2 });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="w-full py-24 px-6 lg:px-12 bg-void" ref={containerRef}>
      <div className="max-w-6xl mx-auto relative">
        
        {/* Desktop Connector Line */}
        <div className="absolute top-12 left-0 w-full hidden md:block z-0 pointer-events-none px-[15%]">
            <svg width="100%" height="20" className="overflow-visible" preserveAspectRatio="none">
                <path 
                    ref={lineRef}
                    d="M 0,10 L 1000,10" 
                    vectorEffect="non-scaling-stroke"
                    stroke="rgba(201,168,76,0.3)" 
                    strokeWidth="2"
                    strokeDasharray="8 8" 
                    fill="none" 
                    pathLength="1000"
                />
            </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
          <Step 
            num="01" 
            title="Set Your Target" 
            desc="Upload your resume and job description — or pick a topic directly. HireByte loads context, calibrates difficulty, and prepares your session." 
          />
          <Step 
            num="02" 
            title="Face the Interview" 
            desc="A live AI interviewer asks. You answer by voice. Your webcam tracks confidence, focus, and emotion in real time." 
          />
          <Step 
            num="03" 
            title="Read Your RIPIS Report" 
            desc="When you finish, your full performance breakdown is ready. Strengths, gaps, a study roadmap, and a downloadable PDF report." 
          />
        </div>
      </div>
    </section>
  );
};

const Step = ({ num, title, desc }: { num: string, title: string, desc: string }) => (
  <div className="step-item opacity-0 flex flex-col items-center md:items-start text-center md:text-left gap-4">
    {/* Node Number */}
    <div className="w-24 h-24 rounded-full bg-void border border-gold/30 flex items-center justify-center shadow-[0_0_30px_rgba(201,168,76,0.1)] mb-4">
      <span className="font-heading text-3xl font-bold text-gold">{num}</span>
    </div>
    
    <h3 className="font-display text-2xl font-bold text-ivory">{title}</h3>
    <p className="font-body text-[#7A6A53] leading-relaxed">{desc}</p>
  </div>
);
