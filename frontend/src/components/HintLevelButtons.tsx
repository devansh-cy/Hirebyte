import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Zap, Code, Lock, CheckCircle } from 'lucide-react';

export type HintLevel = 'small' | 'medium' | 'full';

interface HintLevelButtonsProps {
    onRequestHint: (level: HintLevel, prompt: string) => void;
    isLoading?: boolean;
    availableLevel?: string | null;  // Current available level from progressive system
    topic?: string | null;           // Detected question topic
}

// Prompt templates for each hint level
const HINT_PROMPTS = {
    small: "Give only a directional hint. Do not name algorithms. Do not give code. One sentence only.",
    medium: "Explain the approach. No full solution. No code. High-level explanation only.",
    full: "Provide a partial solution outline with key steps. No complete code."
};

const LEVEL_ORDER: HintLevel[] = ['small', 'medium', 'full'];

export const HintLevelButtons: React.FC<HintLevelButtonsProps> = ({
    onRequestHint,
    isLoading = false,
    availableLevel = 'small',
    topic = null
}) => {
    const [showFullConfirm, setShowFullConfirm] = useState(false);

    // Determine which levels are unlocked/used/available
    const availableIndex = availableLevel ? LEVEL_ORDER.indexOf(availableLevel as HintLevel) : -1;

    const getLevelStatus = (level: HintLevel): 'used' | 'available' | 'locked' => {
        const levelIndex = LEVEL_ORDER.indexOf(level);
        if (availableLevel === null) return 'used'; // All used up
        if (levelIndex < availableIndex) return 'used';
        if (levelIndex === availableIndex) return 'available';
        return 'locked';
    };

    const handleHint = (level: HintLevel) => {
        if (level === 'full' && !showFullConfirm) {
            setShowFullConfirm(true);
            return;
        }
        setShowFullConfirm(false);
        onRequestHint(level, HINT_PROMPTS[level]);
    };

    const levelConfig = {
        small: { icon: Lightbulb, label: 'Small', activeColor: 'gold', desc: 'Direction' },
        medium: { icon: Zap, label: 'Medium', activeColor: 'gold', desc: 'Approach' },
        full: { icon: Code, label: 'Outline', activeColor: 'gold', desc: 'Partial Solution' },
    };

    return (
        <div className="relative">
            {/* Topic Badge */}
            {topic && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded font-heading font-bold tracking-widest uppercase"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    <span className="text-xs text-gold">{topic}</span>
                </motion.div>
            )}

            {/* Main Buttons Container */}
            <div className="bg-panel/80 glass-panel rounded-xl p-2 border border-gold/20 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
                <div className="flex items-center gap-1 bg-surface/80 p-1.5 rounded-lg border border-gold/10 h-14">
                    {LEVEL_ORDER.map((level, i) => {
                        const config = levelConfig[level];
                        const Icon = config.icon;
                        const status = getLevelStatus(level);
                        const isDisabled = isLoading || status === 'locked';
                        const isUsed = status === 'used';
                        const isAvailable = status === 'available';
                        const colorClass = `${config.activeColor}`; // will be 'gold'

                        return (
                            <React.Fragment key={level}>
                                {i > 0 && <div className="w-px h-6 bg-gold/10" />}
                                <motion.button
                                    whileHover={!isDisabled ? { scale: 1.05 } : {}}
                                    whileTap={!isDisabled ? { scale: 0.95 } : {}}
                                    onClick={() => handleHint(level)}
                                    disabled={isDisabled}
                                    className={`flex-1 h-full rounded text-xs font-heading font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group relative border border-transparent ${isUsed
                                            ? 'opacity-40 cursor-default text-muted'
                                            : isAvailable
                                                ? `hover:bg-gold/10 hover:text-gold hover:border-gold/30 hover:shadow-[0_0_10px_rgba(201,168,76,0.2)] text-ivory`
                                                : 'opacity-30 cursor-not-allowed text-muted'
                                        } ${level === 'full' && showFullConfirm ? 'bg-gold/20 text-gold border-gold/50' : ''}`}
                                    title={isUsed ? 'Already used' : status === 'locked' ? `Use ${LEVEL_ORDER[i - 1]} first` : config.desc}
                                >
                                    {isUsed ? (
                                        <CheckCircle size={14} className="text-gold/60" />
                                    ) : status === 'locked' ? (
                                        <Lock size={14} className="text-muted/50" />
                                    ) : (
                                        <Icon size={16} className={`transition-colors ${level === 'full' && showFullConfirm
                                                ? 'text-gold'
                                                : `text-muted group-hover:text-gold`
                                            }`} />
                                    )}
                                    <span>
                                        {level === 'full' && showFullConfirm
                                            ? 'Sure?'
                                            : isUsed
                                                ? '✓'
                                                : config.label}
                                    </span>
                                </motion.button>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Exhausted message */}
                {availableLevel === null && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-heading text-[10px] text-muted tracking-wide text-center mt-2 uppercase"
                    >
                        Assist mode offline
                    </motion.p>
                )}
            </div>
        </div>
    );
};
