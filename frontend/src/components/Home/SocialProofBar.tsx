export const SocialProofBar = () => {
  const row1 = [
    "Google", "Meta", "Amazon", "Microsoft", "Stripe", "Notion", "Figma", "Coinbase",
    "Google", "Meta", "Amazon", "Microsoft", "Stripe", "Notion", "Figma", "Coinbase" // Duplicated for seamless scroll
  ];

  const row2 = [
    "10,000+ interviews completed", 
    "94% report improved confidence", 
    "4.8★ average rating", 
    "RIPIS score accuracy: 96%", 
    "avg. 3 sessions to feel ready",
    "10,000+ interviews completed", 
    "94% report improved confidence", 
    "4.8★ average rating", 
    "RIPIS score accuracy: 96%", 
    "avg. 3 sessions to feel ready" // Duplicated for seamless scroll
  ];

  return (
    <section className="w-full py-16 border-y border-gold/10 bg-void relative overflow-hidden flex flex-col gap-8">
      {/* Edge Fade Masks */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-void to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-void to-transparent z-10 pointer-events-none" />

      {/* Row 1 - Left direction */}
      <div className="flex whitespace-nowrap overflow-hidden">
        <div className="flex animate-scroll items-center gap-16 px-8">
          {row1.map((company, i) => (
            <span 
              key={`r1-${i}`} 
              className="font-heading text-2xl md:text-3xl text-muted font-bold tracking-widest uppercase hover:text-gold hover:drop-shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all duration-300 cursor-default"
            >
              {company}
            </span>
          ))}
        </div>
        <div className="flex animate-scroll items-center gap-16 px-8" aria-hidden="true">
          {row1.map((company, i) => (
            <span 
              key={`r1-dup-${i}`} 
              className="font-heading text-2xl md:text-3xl text-muted font-bold tracking-widest uppercase hover:text-gold hover:drop-shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all duration-300 cursor-default"
            >
              {company}
            </span>
          ))}
        </div>
      </div>

      {/* Row 2 - Right direction */}
      <div className="flex whitespace-nowrap overflow-hidden flex-row-reverse">
        <div className="flex animate-[scroll_40s_linear_infinite_reverse] items-center gap-12 px-6">
          {row2.map((stat, i) => (
            <span 
              key={`r2-${i}`} 
              className="font-body font-medium text-sm md:text-base text-[#7A6A53] border border-gold/15 rounded-full px-6 py-2 bg-void/50 glass-panel uppercase tracking-wide shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            >
              {stat}
            </span>
          ))}
        </div>
        <div className="flex animate-[scroll_40s_linear_infinite_reverse] items-center gap-12 px-6" aria-hidden="true">
          {row2.map((stat, i) => (
            <span 
              key={`r2-dup-${i}`} 
              className="font-body font-medium text-sm md:text-base text-[#7A6A53] border border-gold/15 rounded-full px-6 py-2 bg-void/50 glass-panel uppercase tracking-wide shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            >
              {stat}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
