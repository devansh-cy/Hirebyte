import { ArrowRight, Brain, Sparkles, BarChart3, ChevronRight, Video, Target } from 'lucide-react';

interface HeroProps {
    onStartConfirm: () => void;
}

export const Hero = ({ onStartConfirm }: HeroProps) => {
    return (
        <section className="relative min-h-screen flex flex-col justify-center items-center px-6 overflow-hidden bg-[#050505]">
            {/* Background Vignette & Noise */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#050505] to-[#050505] pointer-events-none" />
            <div className="absolute inset-0 bg-noise pointer-events-none" />
            
            {/* Animated Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[128px] animate-pulse pointer-events-none delay-1000" />

            <div className="max-w-5xl mx-auto text-center relative z-10 pt-20">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-emerald-400 mb-8 backdrop-blur-md">
                    <Sparkles size={12} />
                    <span>AI-Powered Interview Intelligence</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-6 leading-none">
                    Master Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Interview Presence</span>
                </h1>
                
                <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-16 leading-relaxed">
                    Real-time analysis of your technical accuracy, body language, and reasoning capabilities. 
                    No sign-up required.
                </p>

                {/* Feature Cards Grid */}
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
                    <div className="glass-card p-6 text-left group hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:bg-emerald-500/20 transition-colors">
                            <Brain size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Deep Logic Scans</h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            Semantic analysis of your answers to measure technical depth and reasoning quality.
                        </p>
                    </div>
                    
                    <div className="glass-card p-6 text-left group hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4 group-hover:bg-yellow-500/20 transition-colors">
                            <Video size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Visual Engagement</h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            Computer vision tracks eye contact, steadiness, and emotional cues in real-time.
                        </p>
                    </div>

                    <div className="glass-card p-6 text-left group hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white mb-4 group-hover:bg-white/10 transition-colors">
                            <Target size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Smart Benchmarking</h3>
                        <p className="text-sm text-neutral-500 leading-relaxed">
                            Compare your performance against top candidates with weighted readiness scores.
                        </p>
                    </div>
                </div>

                {/* Prominent CTA Card */}
                <div className="relative group max-w-2xl mx-auto">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative glass-panel rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-left">
                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                Ready to Practice?
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </h3>
                            <p className="text-neutral-400 text-sm">Start an instant session with our AI interviewer.</p>
                        </div>
                        
                        <button 
                            onClick={onStartConfirm}
                            className="w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all flex items-center justify-center gap-2 group/btn"
                        >
                            Start Interview
                            <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Footer Text */}
                <div className="mt-16 text-neutral-600 text-xs font-mono">
                    TRUSTED BY CANDIDATES AT TOP TECH COMPANIES
                </div>
            </div>
        </section>
    );
};
