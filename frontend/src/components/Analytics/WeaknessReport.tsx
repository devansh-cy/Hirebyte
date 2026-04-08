import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Target, Clock, Lightbulb, Bug } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';

interface TopicScore {
    topic: string;
    score: number;
    accuracy_avg: number;
    depth_avg: number;
    time_avg: number;
    hint_dependency: number;
    error_count: number;
    question_count: number;
    weakness_score: number;
}

interface WeaknessData {
    topic_scores: Record<string, TopicScore>;
    classification: {
        strong: TopicScore[];
        weak: TopicScore[];
        risk: TopicScore[];
    };
    hint_usage: Record<string, string[]>;
    logical_errors: Array<{
        question_index: number;
        issue_type: string;
        feedback: string;
        severity: string;
    }>;
    question_topics: Record<string, string>;
}

export const WeaknessReport: React.FC = () => {
    const [data, setData] = useState<WeaknessData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.uploadResume.replace('/upload-resume', '')}/api/session/weakness-analysis`);
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (e) {
                console.error('Error fetching weakness data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="glass-panel border-gold/20 rounded-3xl p-8 animate-pulse">
                <div className="h-6 bg-gold/10 rounded w-48 mb-6 border border-gold/20"></div>
                <div className="space-y-4">
                    <div className="h-20 bg-surface/50 rounded-2xl border border-white/5"></div>
                    <div className="h-20 bg-surface/50 rounded-2xl border border-white/5"></div>
                </div>
            </div>
        );
    }

    if (!data || Object.keys(data.topic_scores).length === 0) {
        return null; // No data to show
    }

    const { classification, logical_errors, hint_usage } = data;
    const totalHints = Object.values(hint_usage || {}).reduce((sum, levels) => sum + levels.length, 0);

    return (
        <div className="glass-panel glow-panel border-gold/20 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group">
            <h3 className="font-heading text-xl font-bold mb-6 flex items-center gap-3 text-ivory drop-shadow-gold-glow">
                <Target size={20} className="text-gold animate-pulse" />
                Cognitive Pattern Analysis
            </h3>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-surface/50 rounded-2xl p-4 text-center border border-gold/10 hover:border-gold/30 transition-all">
                    <Lightbulb size={18} className="text-[#E8DCC0] mx-auto mb-2" />
                    <div className="text-2xl font-heading font-bold text-ivory mb-1">{totalHints}</div>
                    <div className="font-heading text-[9px] uppercase tracking-widest text-muted">Hints Used</div>
                </div>
                <div className="bg-surface/50 rounded-2xl p-4 text-center border border-status-red/10 hover:border-status-red/30 transition-all">
                    <Bug size={18} className="text-status-red mx-auto mb-2" />
                    <div className="text-2xl font-heading font-bold text-ivory mb-1">{logical_errors?.length || 0}</div>
                    <div className="font-heading text-[9px] uppercase tracking-widest text-muted">Logic Errors</div>
                </div>
                <div className="bg-surface/50 rounded-2xl p-4 text-center border border-gold/10 hover:border-gold/30 transition-all">
                    <Shield size={18} className="text-gold mx-auto mb-2" />
                    <div className="text-2xl font-heading font-bold text-ivory mb-1 drop-shadow-gold-glow">{Object.keys(data.topic_scores).length}</div>
                    <div className="font-heading text-[9px] uppercase tracking-widest text-muted">Topics Covered</div>
                </div>
            </div>

            {/* Strong Topics */}
            {classification.strong.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={14} className="text-gold" />
                        <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-gold">Strong Topics</span>
                    </div>
                    <div className="space-y-3">
                        {classification.strong.map((t: TopicScore, i: number) => (
                            <TopicCard key={i} topic={t} variant="strong" />
                        ))}
                    </div>
                </div>
            )}

            {/* Risk Topics */}
            {classification.risk.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={14} className="text-[#E8DCC0]" />
                        <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-[#E8DCC0]">Needs Attention</span>
                    </div>
                    <div className="space-y-3">
                        {classification.risk.map((t: TopicScore, i: number) => (
                            <TopicCard key={i} topic={t} variant="risk" />
                        ))}
                    </div>
                </div>
            )}

            {/* Weak Topics */}
            {classification.weak.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={14} className="text-status-red" />
                        <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-status-red">Weak Topics</span>
                    </div>
                    <div className="space-y-3">
                        {classification.weak.map((t: TopicScore, i: number) => (
                            <TopicCard key={i} topic={t} variant="weak" />
                        ))}
                    </div>
                </div>
            )}

            {/* Logical Errors List */}
            {logical_errors && logical_errors.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gold/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Bug size={14} className="text-status-red" />
                        <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-status-red">Logical Issues Detected</span>
                    </div>
                    <div className="space-y-3">
                        {logical_errors.map((err, i) => (
                            <div key={i} className={`font-body text-xs leading-relaxed p-3 rounded-xl border ${err.severity === 'error' ? 'bg-status-red/5 border-status-red/20 text-ivory' :
                                err.severity === 'warning' ? 'bg-[#E8DCC0]/5 border-[#E8DCC0]/20 text-ivory' :
                                    'bg-gold/5 border-gold/20 text-ivory'
                                }`}>
                                <span className="font-heading text-[10px] font-bold uppercase tracking-widest mr-2" style={{ color: err.severity === 'error' ? '#EF4444' : err.severity === 'warning' ? '#E8DCC0' : '#C9A84C' }}>[{err.issue_type.replace(/_/g, ' ')}]</span>
                                {err.feedback}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Topic card sub-component
const TopicCard: React.FC<{ topic: TopicScore; variant: 'strong' | 'weak' | 'risk' }> = ({ topic, variant }) => {
    const barColor = variant === 'strong' ? 'bg-gold' : variant === 'risk' ? 'bg-[#E8DCC0]' : 'bg-status-red';
    const textColor = variant === 'strong' ? 'text-gold' : variant === 'risk' ? 'text-[#E8DCC0]' : 'text-status-red';
    const score = Math.max(0, 100 - topic.weakness_score); // Invert: higher = better for display

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface/30 rounded-2xl p-4 border border-white/5 hover:border-gold/20 transition-colors"
        >
            <div className="flex justify-between items-center mb-2">
                <span className="font-heading text-[11px] font-bold uppercase tracking-widest text-ivory truncate mr-4">{topic.topic}</span>
                <span className={`font-heading text-xs font-bold ${textColor}`}>{score}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mb-3 shadow-inner">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${barColor}`}
                    style={{ boxShadow: `0 0 10px ${variant === 'strong' ? '#C9A84C' : variant === 'risk' ? '#E8DCC0' : '#EF4444'}`}}
                />
            </div>
            <div className="flex gap-4 text-xs font-heading text-[9px] uppercase tracking-widest text-muted">
                {topic.time_avg > 0 && (
                    <span className="flex items-center gap-1">
                        <Clock size={10} /> {topic.time_avg}s
                    </span>
                )}
                {topic.hint_dependency > 0 && (
                    <span className="flex items-center gap-1">
                        <Lightbulb size={10} /> {(topic.hint_dependency * 100).toFixed(0)}% hints
                    </span>
                )}
            </div>
        </motion.div>
    );
};
