import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const FeaturesSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll reveal stagger
    const cards = containerRef.current?.querySelectorAll('.feature-card');
    if (!cards) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.fromTo(cards, 
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
          );
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="w-full py-24 px-6 lg:px-12 bg-void" ref={containerRef}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl font-bold text-ivory mb-4">Precision Instrumentation</h2>
          <p className="font-body text-[#7A6A53]">HireByte uses three distinct layers to map your capabilities, transforming abstract performance into measurable axes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard1 />
          <FeatureCard2 />
          <FeatureCard3 />
        </div>
      </div>
    </section>
  );
};

// Card 1: AI Interviewer
const FeatureCard1 = () => {
  const items = [
    "● QUESTION LOADED      [DSA - Hard]",
    "● ADAPTING TO RESPONSE [Analyzing...]",
    "● NEXT TOPIC READY     [System Design]"
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="feature-card glass-panel p-8 flex flex-col group cursor-default">
      <div className="h-48 mb-6 relative border border-gold/15 rounded-xl bg-void/50 overflow-hidden flex items-center justify-center p-4">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,168,76,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,168,76,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />
        
        <div className="relative font-mono text-gold text-sm sm:text-base leading-relaxed tracking-wider animate-in fade-in zoom-in-95 duration-500" key={currentIndex}>
          {items[currentIndex]}
        </div>
      </div>
      <h3 className="font-display text-xl font-bold text-ivory mb-2 group-hover:text-gold transition-colors">Adaptive AI Interviewer</h3>
      <p className="font-body text-[#7A6A53] text-sm leading-relaxed">Questions adjust to your answers. No two sessions are the same.</p>
    </div>
  );
};

// Card 2: Live Analysis
const FeatureCard2 = () => {
  return (
    <div className="feature-card glass-panel p-8 flex flex-col group cursor-default">
      <div className="h-48 mb-6 relative border border-gold/15 rounded-xl bg-void/50 overflow-hidden p-4">
        {/* Scanner effect (Subtle vertical line moving across) */}
        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-b from-transparent via-gold/10 to-transparent animate-[scroll_4s_linear_infinite] opacity-50" />
        
        <div className="font-mono text-muted text-xs leading-loose flex flex-col gap-1 relative z-10">
          <span className="text-muted">[00:03:42] Confidence detected: 78% <span className="text-status-green">↑</span></span>
          <span className="text-muted">[00:03:45] Eye contact: maintained</span>
          <span className="text-muted">[00:03:51] Speech clarity: high</span>
          <span className="text-muted">[00:03:58] Stress marker: none detected</span>
          <span className="text-gold mt-2 font-bold animate-pulse-dot">● LIVE ANALYSIS ACTIVE</span>
        </div>
      </div>
      <h3 className="font-display text-xl font-bold text-ivory mb-2 group-hover:text-gold transition-colors">Real-Time Behavioral Analysis</h3>
      <p className="font-body text-[#7A6A53] text-sm leading-relaxed">Your webcam feed scores confidence, focus, and emotion live.</p>
    </div>
  );
};

// Card 3: RIPIS Score
const FeatureCard3 = () => {
  return (
    <div className="feature-card glass-panel p-8 flex flex-col group cursor-default">
      <div className="h-48 mb-6 relative border border-gold/15 rounded-xl bg-void/50 overflow-hidden p-4 flex items-end">
        {/* SVG Chart */}
        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 60" preserveAspectRatio="none">
          {/* Grid */}
          <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(201,168,76,0.2)" strokeWidth="1" />
          <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(201,168,76,0.1)" strokeWidth="0.5" strokeDasharray="2" />
          
          {/* Animated Line - Data: 41 -> 58 -> 63 -> 74 -> 81 -> 89  => scaled roughly to 60 box */}
          <path 
            className="group-hover:stroke-gold-light transition-all duration-500"
            d="M 0,45 L 20,35 L 40,32 L 60,25 L 80,21 L 100,16" 
            fill="none" 
            stroke="#C9A84C" 
            strokeWidth="2" 
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset="0"
          >
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" fill="freeze" />
          </path>
          
          {/* Data Points */}
          {[
            {x: 0, y: 45}, {x: 20, y: 35}, {x: 40, y: 32}, 
            {x: 60, y: 25}, {x: 80, y: 21}, {x: 100, y: 16}
          ].map((pt, i) => (
            <circle 
              key={i}
              cx={pt.x} 
              cy={pt.y} 
              r="2" 
              fill="#080808" 
              stroke="#C9A84C" 
              strokeWidth="1.5"
              className="animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </svg>
      </div>
      <h3 className="font-display text-xl font-bold text-ivory mb-2 group-hover:text-gold transition-colors">RIPIS Score Progression</h3>
      <p className="font-body text-[#7A6A53] text-sm leading-relaxed">Technical readiness, reasoning density, and soft skills — all tracked.</p>
    </div>
  );
};
