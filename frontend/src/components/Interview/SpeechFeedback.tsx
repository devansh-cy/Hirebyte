import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Clock, AlertTriangle } from 'lucide-react';

interface SpeechFeedbackProps {
    feedback: {
        wpm: number;
        pace: string;
        filler_count: number;
        confidence_level: string;
        long_silence: boolean;
        feedback: string;
    } | null;
    onDismiss: () => void;
}

const paceConfig: Record<string, { color: string; label: string }> = {
    too_slow: { color: 'text-status-red', label: 'Too Slow' },
    slow: { color: 'text-[#C9A84C]', label: 'Slow' },
    normal: { color: 'text-gold', label: 'Optimal' },
    fast: { color: 'text-[#E8DCC0]', label: 'Fast' },
    too_fast: { color: 'text-status-red', label: 'Too Fast' },
};

const confidenceColors: Record<string, string> = {
    high: 'border-gold/30 bg-gold/5',
    medium: 'border-[#E8DCC0]/30 bg-[#E8DCC0]/5',
    low: 'border-status-red/30 bg-status-red/5',
};

export const SpeechFeedback: React.FC<SpeechFeedbackProps> = ({ feedback, onDismiss }) => {
    if (!feedback) return null;

    const pace = paceConfig[feedback.pace] || paceConfig.normal;
    const borderColor = confidenceColors[feedback.confidence_level] || confidenceColors.medium;

    return (
        <AnimatePresence>
            {feedback && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`glass-panel rounded-xl border p-4 backdrop-blur-md shadow-lg ${borderColor} cursor-pointer hover:shadow-gold-glow`}
                    onClick={onDismiss}
                >
                    {/* Metrics row */}
                    <div className="flex items-center flex-wrap gap-4 mb-3">
                        <div className="flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded border border-white/5">
                            <Volume2 size={12} className={pace.color} />
                            <span className={`font-heading text-[10px] font-bold uppercase tracking-widest ${pace.color}`}>{pace.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded border border-white/5">
                            <Mic size={12} className="text-gold" />
                            <span className="font-heading text-[10px] text-gold font-bold uppercase tracking-widest">{feedback.wpm} WPM</span>
                        </div>

                        {feedback.filler_count > 0 && (
                            <div className="flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded border border-white/5">
                                <AlertTriangle size={12} className="text-gold" />
                                <span className="font-heading text-[10px] text-gold font-bold uppercase tracking-widest">{feedback.filler_count} fillers</span>
                            </div>
                        )}

                        {feedback.long_silence && (
                            <div className="flex items-center gap-1.5 bg-surface/50 px-2 py-1 rounded border border-white/5">
                                <Clock size={12} className="text-status-red" />
                                <span className="font-heading text-[10px] text-status-red font-bold uppercase tracking-widest">Long pause</span>
                            </div>
                        )}
                    </div>

                    {/* Feedback message */}
                    <p className="font-body text-sm text-ivory leading-relaxed">
                        {feedback.feedback}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
