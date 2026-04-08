import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

interface AIAssistanceBadgeProps {
    isConnected: boolean;
}

export const AIAssistanceBadge: React.FC<AIAssistanceBadgeProps> = ({ isConnected }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Badge */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`backdrop-blur-md px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-heading font-bold tracking-wide cursor-help transition-all ${
                    isConnected
                        ? 'bg-gold/10 border-gold/20 text-gold animate-pulse'
                        : 'bg-surface/60 border-status-red/30 text-status-red'
                }`}
            >
                {/* Pulsing Dot */}
                <span className="relative flex h-2 w-2">
                    <span 
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            isConnected ? 'bg-gold' : 'bg-status-red'
                        }`}
                    />
                    <span 
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                            isConnected ? 'bg-gold' : 'bg-status-red'
                        }`}
                    />
                </span>

                {/* Icon */}
                <Brain size={14} />

                {/* Text */}
                <span className="uppercase">{isConnected ? 'System Active' : 'System Offline'}</span>
            </motion.div>

            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full right-0 mt-2 z-50"
                    >
                        <div className="bg-panel border border-gold/20 rounded-xl p-3 shadow-[0_0_20px_rgba(201,168,76,0.1)] backdrop-blur-md min-w-[220px]">
                            <div className="flex items-start gap-2">
                                <div className={`p-1.5 rounded-lg ${isConnected ? 'bg-gold/10 text-gold' : 'bg-status-red/10 text-status-red'}`}>
                                    <Brain size={14} />
                                </div>
                                <div>
                                    <p className="font-heading text-sm font-bold text-ivory mb-1">
                                        {isConnected ? 'Link Established' : 'Awaiting Connection...'}
                                    </p>
                                    <p className="font-body text-xs text-[#7A6A53] leading-relaxed">
                                        {isConnected 
                                            ? 'The system is streaming analytical telemetry and context back to the interviewer.'
                                            : 'Establishing connection to AI services...'
                                        }
                                    </p>
                                </div>
                            </div>
                            
                            {/* Arrow pointing up */}
                            <div className="absolute -top-1 right-4 w-2 h-2 bg-panel border-l border-t border-gold/20 rotate-45" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
