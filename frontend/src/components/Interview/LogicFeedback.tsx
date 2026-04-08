import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface LogicFeedbackProps {
    feedback: {
        issue_type: string;
        feedback: string;
        severity: 'info' | 'warning' | 'error';
    } | null;
    onDismiss: () => void;
}

const severityConfig = {
    info: {
        icon: Info,
        bgClass: 'bg-[#E8DCC0]/10 border-[#E8DCC0]/30',
        textClass: 'text-[#E8DCC0]',
        iconClass: 'text-[#E8DCC0]',
        label: 'Note'
    },
    warning: {
        icon: AlertTriangle,
        bgClass: 'bg-gold/10 border-gold/30',
        textClass: 'text-gold',
        iconClass: 'text-gold',
        label: 'Think Again'
    },
    error: {
        icon: AlertCircle,
        bgClass: 'bg-status-red/10 border-status-red/30',
        textClass: 'text-status-red',
        iconClass: 'text-status-red',
        label: 'Check This'
    }
};

export const LogicFeedback: React.FC<LogicFeedbackProps> = ({ feedback, onDismiss }) => {
    if (!feedback) return null;

    const config = severityConfig[feedback.severity] || severityConfig.info;
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {feedback && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`glass-panel rounded-xl border p-4 ${config.bgClass} backdrop-blur-md shadow-lg`}
                >
                    <div className="flex items-start gap-3">
                        <Icon size={18} className={`${config.iconClass} mt-0.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={`font-heading text-[11px] font-bold uppercase tracking-widest ${config.textClass}`}>
                                    {config.label}
                                </span>
                                <span className="font-heading text-[10px] text-muted uppercase tracking-widest truncate">
                                    [ {feedback.issue_type.replace(/_/g, ' ')} ]
                                </span>
                            </div>
                            <p className="font-body text-sm text-ivory leading-relaxed">
                                {feedback.feedback}
                            </p>
                        </div>
                        <button
                            onClick={onDismiss}
                            className="text-muted hover:text-ivory transition-colors shrink-0 p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
