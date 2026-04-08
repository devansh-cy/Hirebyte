import { Github, Linkedin, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-[#080808] rounded-t-[3.5rem] pt-16 pb-8 px-6 lg:px-12 mt-20 border-t border-[rgba(201,168,76,0.08)] relative z-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 gap-y-16">
        {/* Left Column: Branding */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-gold font-bold text-2xl tracking-tight">HireByte</span>
          </div>
          <p className="text-sm font-body text-muted leading-relaxed max-w-xs">
            Train like you're already hired.
          </p>
        </div>

        {/* Center Column: Quick Links */}
        <div className="flex flex-col md:items-center">
          <ul className="space-y-4 text-sm font-body text-[#5A5040]">
            <li><a href="#features" className="hover:text-gold transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-gold transition-colors">How It Works</a></li>
            <li><a href="#analytics" className="hover:text-gold transition-colors">Analytics</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Terms of Service</a></li>
          </ul>
        </div>

        {/* Right Column: Socials & Legal */}
        <div className="flex flex-col md:items-end">
          <div className="flex gap-4">
            <SocialIcon Icon={Github} href="#" />
            <SocialIcon Icon={Linkedin} href="#" />
            <SocialIcon Icon={Twitter} href="#" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-gold/10 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-[#5A5040] gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-status-green shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></div>
          <span className="tracking-widest">SYSTEM OPERATIONAL</span>
        </div>
        <p className="tracking-wide">© 2025 HireByte. Built by Alphabyte Team.</p>
      </div>
    </footer>
  );
};

const SocialIcon = ({ Icon, href }: { Icon: React.ElementType, href: string }) => (
  <a href={href} className="w-10 h-10 rounded-full bg-transparent border border-gold/20 flex items-center justify-center text-gold hover:bg-gold/10 hover:border-gold/50 hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all">
    <Icon size={18} />
  </a>
);
