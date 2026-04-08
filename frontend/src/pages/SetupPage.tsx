import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { Loader2, ArrowRight, Brain, Code, Globe, Sparkles } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { ConsentModal } from '../components/ConsentModal';

type InterviewMode = 'resume' | 'topic';
type TopicOption = 'AI_ML' | 'DSA' | 'WEB_DEV';

const TOPIC_OPTIONS: { key: TopicOption; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'AI_ML', label: 'AI / ML', icon: <Brain size={24} />, description: 'Machine Learning, Neural Networks, NLP' },
    { key: 'DSA', label: 'DSA', icon: <Code size={24} />, description: 'Arrays, Trees, Graphs, DP' },
    { key: 'WEB_DEV', label: 'Web Dev', icon: <Globe size={24} />, description: 'React, Node.js, System Design' },
];

export const SetupPage: React.FC = () => {
    const navigate = useNavigate();
    const [interviewMode, setInterviewMode] = useState<InterviewMode>('resume');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<TopicOption | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [consentGiven, setConsentGiven] = useState(() => {
        return localStorage.getItem('aiConsent') === 'true';
    });

    const canStart = interviewMode === 'resume'
        ? (selectedFile && jobDescription)
        : (selectedTopic !== null);

    const handleStartInterviewClick = () => {
        if (!canStart) return;

        if (consentGiven) {
            proceedWithInterview();
        } else {
            setShowConsentModal(true);
        }
    };

    const handleConsentAgree = () => {
        setConsentGiven(true);
        localStorage.setItem('aiConsent', 'true');
        setShowConsentModal(false);
        proceedWithInterview();
    };

    const proceedWithInterview = async () => {
        setIsSubmitting(true);
        try {
            if (interviewMode === 'resume') {
                const formData = new FormData();
                formData.append('file', selectedFile!);
                formData.append('job_description', jobDescription);
                formData.append('difficulty', difficulty);

                const response = await fetch(API_ENDPOINTS.uploadResume, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error("Backend upload failed");

                navigate('/interview', {
                    state: {
                        selectedFile,
                        jobDescription,
                        difficulty,
                        interviewMode: 'resume'
                    }
                });
            } else {
                const response = await fetch(API_ENDPOINTS.startTopicInterview, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: selectedTopic,
                        difficulty: difficulty,
                    }),
                });

                if (!response.ok) throw new Error("Backend topic setup failed");

                navigate('/interview', {
                    state: {
                        selectedTopic,
                        difficulty,
                        interviewMode: 'topic'
                    }
                });
            }
        } catch (error) {
            console.error('Error starting interview:', error);
            alert(`Connection Error: ${error}\n\nPlease check console for details.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative overflow-hidden bg-void">
             {/* Ambient Background */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg glass-panel glow-panel rounded-3xl p-8 relative z-10">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-display font-bold mb-3 flex items-center justify-center gap-3">
                        <Sparkles className="text-gold animate-pulse" size={28} />
                        <span className="text-ivory tracking-tight">Session Setup</span>
                    </h2>
                    <p className="font-body text-[#7A6A53] text-sm">Configure your AI interview environment.</p>
                </div>

                <div className="space-y-8">
                    {/* Mode Toggle */}
                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-surface/50 rounded-2xl border border-gold/10">
                        <button
                            onClick={() => setInterviewMode('resume')}
                            className={`py-3 px-4 rounded-xl text-sm font-heading font-bold transition-all duration-300 ${interviewMode === 'resume'
                                ? 'bg-panel border border-gold/30 text-gold shadow-[0_0_15px_rgba(201,168,76,0.15)]'
                                : 'text-muted hover:text-[#7A6A53] hover:bg-surface'
                                }`}
                        >
                            Resume & JD
                        </button>
                        <button
                            onClick={() => setInterviewMode('topic')}
                            className={`py-3 px-4 rounded-xl text-sm font-heading font-bold transition-all duration-300 ${interviewMode === 'topic'
                                ? 'bg-panel border border-gold/30 text-gold shadow-[0_0_15px_rgba(201,168,76,0.15)]'
                                : 'text-muted hover:text-[#7A6A53] hover:bg-surface'
                                }`}
                        >
                            Topic Focus
                        </button>
                    </div>

                    {/* Resume Mode */}
                    {interviewMode === 'resume' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />

                            <div className="space-y-3">
                                <label className="text-xs font-heading font-bold text-[#7A6A53] uppercase tracking-wider ml-2">Job Context</label>
                                <textarea
                                    className="w-full min-h-[120px] resize-none bg-surface/50 border border-gold/20 rounded-xl p-4 text-sm font-body text-ivory placeholder:text-muted/50 focus:outline-none focus:border-gold focus:shadow-[0_0_15px_rgba(201,168,76,0.2)] transition-all"
                                    placeholder="Paste job description or key requirements here..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Topic Mode */}
                    {interviewMode === 'topic' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <label className="text-xs font-heading font-bold text-[#7A6A53] uppercase tracking-wider ml-2">Target Domain</label>
                            <div className="grid grid-cols-3 gap-4">
                                {TOPIC_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.key}
                                        onClick={() => setSelectedTopic(opt.key)}
                                        className={`glass-panel p-5 rounded-2xl flex flex-col items-center gap-4 transition-all duration-300 ${selectedTopic === opt.key
                                            ? 'border-gold bg-gold/5 text-ivory shadow-[0_0_20px_rgba(201,168,76,0.2)] scale-105'
                                            : 'border-gold/10 text-muted hover:text-ivory hover:border-gold/30 hover:-translate-y-1'
                                            }`}
                                    >
                                        <div className={`transition-colors duration-300 ${selectedTopic === opt.key ? 'text-gold drop-shadow-[0_0_8px_rgba(201,168,76,0.6)]' : 'text-muted/70'}`}>
                                            {opt.icon}
                                        </div>
                                        <span className="text-xs font-heading font-bold tracking-wide">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                            {selectedTopic && (
                                <p className="text-sm text-gold text-center font-body bg-gold/5 p-3 rounded-xl border border-gold/20 animate-in fade-in zoom-in-95 duration-300">
                                    {TOPIC_OPTIONS.find(o => o.key === selectedTopic)?.description}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Difficulty Selector */}
                    <div className="space-y-4 pt-2">
                        <label className="text-xs font-heading font-bold text-[#7A6A53] uppercase tracking-wider ml-2">Intensity Level</label>
                        <div className="grid grid-cols-3 gap-4">
                            {(['easy', 'medium', 'hard'] as const).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    className={`py-3 px-4 rounded-full border text-xs font-heading font-bold uppercase tracking-widest transition-all duration-300 ${difficulty === level
                                        ? 'bg-gold text-void border-gold shadow-[0_0_20px_rgba(201,168,76,0.4)] scale-105'
                                        : 'bg-surface border-gold/10 text-muted hover:border-gold/30 hover:text-ivory'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={handleStartInterviewClick}
                            disabled={!canStart || isSubmitting}
                            className="w-full relative group glass-button overflow-hidden py-4 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none bg-panel border border-gold/20 hover:border-gold/50 hover:shadow-[0_0_20px_rgba(201,168,76,0.2)]"
                        >
                            <div className="absolute inset-0 bg-gold opacity-5 group-hover:opacity-10 transition-opacity" />
                            {isSubmitting ? (
                                <Loader2 className="animate-spin text-gold" />
                            ) : (
                                <span className="font-heading font-bold text-gold group-hover:text-gold-light group-disabled:text-muted transition-colors flex items-center tracking-widest uppercase relative z-10">
                                    Initialize Session
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <ConsentModal
                isOpen={showConsentModal}
                onAgree={handleConsentAgree}
                onCancel={() => setShowConsentModal(false)}
            />
        </div>
    );
};
