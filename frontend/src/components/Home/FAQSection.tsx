import { useState } from 'react';
import { Plus } from 'lucide-react';

const faqs = [
  {
    q: "Is HireByte connected to real companies or recruiters?",
    a: "No. HireByte is a private practice environment. Nothing you say is shared with employers. Your sessions belong to you."
  },
  {
    q: "What topics does the AI cover?",
    a: "DSA, System Design, OS, DBMS, Networking, React, Python, and Behavioral. You choose the focus at setup."
  },
  {
    q: "Do I need to upload a resume?",
    a: "No. You can start a topic-based session directly. Uploading a resume gives the AI more personalized context."
  },
  {
    q: "How is HireByte different from just practicing on LeetCode?",
    a: "LeetCode tests what you know. HireByte tests how you communicate it. Real interviews fail people on clarity, not just correctness."
  },
  {
    q: "Is the webcam feed stored anywhere?",
    a: "No. Video data is processed in real time and never stored. Only your analytics and transcript are saved."
  }
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="w-full py-24 px-6 lg:px-12 bg-void">
      <div className="max-w-3xl mx-auto flex flex-col gap-12">
        
        <h2 className="font-display font-bold text-4xl text-ivory text-center">Frequently Asked Questions</h2>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`border border-gold/15 rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === i ? 'bg-[#080808]/80 border-gold/30 shadow-[0_0_20px_rgba(201,168,76,0.05)]' : 'bg-[#080808]/50 hover:bg-[#080808]/80'}`}
            >
              <button 
                className="w-full text-left p-6 flex items-center justify-between gap-4 select-none focus:outline-none"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-display font-semibold text-lg text-ivory pr-4">{faq.q}</span>
                <div className={`text-gold transition-transform duration-300 ${openIndex === i ? 'rotate-45 drop-shadow-[0_0_8px_rgba(201,168,76,0.6)]' : 'rotate-0'}`}>
                  <Plus size={24} />
                </div>
              </button>
              
              <div 
                className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${openIndex === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="p-6 pt-0 font-body text-[#7A6A53] leading-relaxed">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
