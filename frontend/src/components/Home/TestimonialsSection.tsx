import { useState, useRef } from 'react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "I bombed my first three real interviews. After six HireByte sessions, I got an offer from Stripe. The RIPIS report told me exactly what to fix.",
    author: "Arjun M.",
    role: "Software Engineer, Stripe"
  },
  {
    quote: "The real-time confidence score changed how I answer questions. I didn't realize I was trailing off until I saw the drop in the graph.",
    author: "Priya S.",
    role: "CS Graduate, IIT Delhi"
  },
  {
    quote: "The AI pushed back when I gave vague answers. No prep course does that. My system design answers are completely different now.",
    author: "Daniel K.",
    role: "Senior Engineer, Coinbase"
  }
];

export const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  const handleNext = () => {
    if (!textRef.current) return;
    
    // Animate out
    gsap.to(textRef.current, {
      opacity: 0,
      x: 60,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        // Animate in
        gsap.fromTo(textRef.current,
          { opacity: 0, x: -60 },
          { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
        );
      }
    });
  };

  const handlePrev = () => {
    if (!textRef.current) return;
    
    gsap.to(textRef.current, {
      opacity: 0,
      x: -60,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
        gsap.fromTo(textRef.current,
          { opacity: 0, x: 60 },
          { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" }
        );
      }
    });
  };

  return (
    <section className="w-full py-32 px-6 lg:px-12 bg-void overflow-hidden">
      <div className="max-w-5xl mx-auto relative flex flex-col items-center">
        
        {/* Large Decorative Quote */}
        <span className="font-display italic text-gold/10 text-[12rem] leading-none absolute -top-16 left-0 select-none md:left-24 pointer-events-none">
          "
        </span>

        <div className="relative z-10 w-full md:w-3/4 min-h-[300px] flex flex-col justify-center gap-8 mt-12 md:mt-24">
          
          <div ref={textRef} className="flex flex-col gap-6 text-center">
            <p className="font-body text-ivory text-[clamp(1.2rem,3vw,2rem)] leading-relaxed italic">
              {testimonials[currentIndex].quote}
            </p>
            <div className="flex flex-col gap-1 items-center mt-4">
              <span className="font-display font-semibold text-lg text-gold">{testimonials[currentIndex].author}</span>
              <span className="font-heading font-medium text-sm text-[#7A6A53] uppercase tracking-wider">{testimonials[currentIndex].role}</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center gap-6 mt-8">
            <button 
              onClick={handlePrev}
              className="p-3 rounded-full border border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/50 transition-all hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] group"
            >
              <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-gold shadow-[0_0_10px_rgba(201,168,76,0.8)] w-6' : 'bg-[#080808] border border-gold/20'}`}
                />
              ))}
            </div>
            <button 
              onClick={handleNext}
              className="p-3 rounded-full border border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/50 transition-all hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] group"
            >
              <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
