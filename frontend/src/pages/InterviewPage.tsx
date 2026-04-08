import React, { useState, useCallback } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { useLocation, useNavigate } from 'react-router-dom';
import { VideoAnalysis } from '../components/VideoInterview/VideoAnalysis';
import { ChatBox } from '../components/Interview/ChatBox';
import { HintLevelButtons, HintLevel } from '../components/HintLevelButtons';
import { LogicFeedback } from '../components/Interview/LogicFeedback';
import { SpeechFeedback } from '../components/Interview/SpeechFeedback';
import { Sparkles, Lightbulb } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

export const InterviewPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedFile, jobDescription } = location.state || {}; // Retrieve passed state

    // Speaking state management
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [hintLoading, setHintLoading] = useState(false);
    const [hintTopic, setHintTopic] = useState<string | null>(null);
    const [availableHintLevel, setAvailableHintLevel] = useState<string | null>('small');

    // Real-time feedback state
    const [logicFeedback, setLogicFeedback] = useState<{
        issue_type: string; feedback: string; severity: 'info' | 'warning' | 'error';
    } | null>(null);
    const [speechFeedback, setSpeechFeedback] = useState<{
        wpm: number; pace: string; filler_count: number; confidence_level: string; long_silence: boolean; feedback: string;
    } | null>(null);

    // Callbacks
    const handleAISpeakingChange = useCallback((speaking: boolean) => {
        setIsAISpeaking(speaking);
    }, []);

    const handleUserSpeakingChange = useCallback((speaking: boolean) => {
        setIsUserSpeaking(speaking);
    }, []);

    // Handle hint requests
    const handleHintRequest = async (level: HintLevel, prompt: string) => {
        setHintLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.getHint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: prompt, level })
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentHint(data.hint || 'Focus on your relevant experience.');
                if (data.available_level !== undefined) setAvailableHintLevel(data.available_level);
                if (data.topic) setHintTopic(data.topic);
            } else {
                const fallbackHints = {
                    small: "Focus on the key skills mentioned in your resume.",
                    medium: "Structure your answer: Situation, Task, Action, Result.",
                    full: "Provide specific examples from your experience that match the job requirements."
                };
                setCurrentHint(fallbackHints[level]);
            }
            setTimeout(() => setCurrentHint(null), 45000);
        } catch (error) {
            console.error('Hint request error:', error);
            setCurrentHint("Consider your relevant experience for this question.");
        } finally {
            setHintLoading(false);
        }
    };

    const handleLogicFeedback = useCallback((feedback: { issue_type: string; feedback: string; severity: string }) => {
        setLogicFeedback(feedback as any);
        setTimeout(() => setLogicFeedback(null), 15000);
    }, []);

    const handleSpeechFeedback = useCallback((feedback: { wpm: number; pace: string; filler_count: number; confidence_level: string; long_silence: boolean; feedback: string }) => {
        setSpeechFeedback(feedback);
        setTimeout(() => setSpeechFeedback(null), 10000);
    }, []);

    const handleEndInterview = async () => {
        try {
            await fetch(API_ENDPOINTS.stopCamera, {
                method: 'POST'
            });

            // Navigate to Analytics page for summary (Performance Report)
            // The Analytics page will fetch data from /api/analytics
            navigate('/analytics?id=current');


        } catch (error) {
            console.error('Error ending interview:', error);
            alert("An error occurred while generating the report.");
            navigate('/');
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] p-2 overflow-hidden relative bg-void">
            <Group id="interview-layout-v4" orientation="horizontal" className="max-w-[1920px] mx-auto h-full">

                {/* Left Panel: Context & Inputs */}
                <Panel id="left-panel" defaultSize="25" minSize="20" maxSize="40" className="mr-2">
                    <div className="h-full flex flex-col gap-4 glass-panel glow-panel rounded-2xl p-4 overflow-y-auto relative z-10 border-gold/20">
                        <div className="mb-4">
                            <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-1 text-ivory">
                                <Sparkles size={18} className="text-gold animate-pulse" />
                                Session Telemetry
                            </h3>
                            <p className="font-heading text-xs tracking-widest uppercase text-muted">Context & Parameters</p>
                        </div>

                        <div className="p-4 bg-surface/50 rounded-xl text-sm border border-gold/10">
                            <span className="font-heading text-xs font-bold text-muted uppercase tracking-widest block mb-2">Resume Context</span>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-status-red/10 text-status-red flex items-center justify-center font-heading text-xs font-bold tracking-widest border border-status-red/20">PDF</div>
                                <span className="truncate flex-1 font-body text-ivory text-sm">{selectedFile?.name || "No Resume active."}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-surface/50 rounded-xl text-sm border border-gold/10 flex-1 overflow-hidden flex flex-col">
                            <span className="font-heading text-xs font-bold text-muted uppercase tracking-widest block mb-2">Target Profile</span>
                            <p className="font-body text-[#7A6A53] text-xs leading-relaxed overflow-y-auto whitespace-pre-wrap flex-1 scroll-smooth">
                                {jobDescription || "No target profile provided."}
                            </p>
                        </div>

                        {/* Hints Section */}
                        <div className="mt-auto space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Lightbulb size={16} className="text-gold animate-pulse" />
                                <span className="font-heading text-xs font-bold text-gold uppercase tracking-widest">Co-Pilot Link</span>
                            </div>
                            <HintLevelButtons
                                onRequestHint={handleHintRequest}
                                isLoading={hintLoading}
                                availableLevel={availableHintLevel}
                                topic={hintTopic}
                            />
                            <button
                                onClick={handleEndInterview}
                                className="w-full py-3 mt-4 group relative overflow-hidden glass-button bg-status-red/10 hover:bg-status-red/20 text-status-red border border-status-red/30 rounded-full font-heading font-bold tracking-widest transition-all"
                            >
                                <span className="relative z-10 group-hover:text-white transition-colors">TERMINATE SESSION</span>
                                <div className="absolute inset-0 bg-status-red opacity-0 group-hover:opacity-20 transition-opacity" />
                            </button>
                        </div>
                    </div>
                </Panel>

                <Separator className="w-2 mx-1 rounded-full bg-gold/10 hover:bg-gold/40 transition-colors shadow-[0_0_10px_rgba(201,168,76,0.1)] cursor-col-resize flex flex-col justify-center items-center gap-1 group">
                    <div className="w-1 h-8 bg-gold/30 group-hover:bg-gold rounded-full transition-colors shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                </Separator>

                {/* Center Panel: Video Stream */}
                <Panel id="center-panel" defaultSize="50" minSize="30">
                    <div className="h-full flex flex-col">
                        <VideoAnalysis
                            isAISpeaking={isAISpeaking}
                            isUserSpeaking={isUserSpeaking}
                            currentHint={currentHint}
                        />
                    </div>
                </Panel>

                <Separator className="w-2 mx-1 rounded-full bg-gold/10 hover:bg-gold/40 transition-colors shadow-[0_0_10px_rgba(201,168,76,0.1)] cursor-col-resize flex flex-col justify-center items-center gap-1 group">
                    <div className="w-1 h-8 bg-gold/30 group-hover:bg-gold rounded-full transition-colors shadow-[0_0_10px_rgba(201,168,76,0.5)]" />
                </Separator>

                {/* Right Panel: Chat + Real-time Feedback */}
                <Panel id="right-panel" defaultSize="25" minSize="20" className="ml-2">
                    <div className="h-full flex flex-col gap-2">
                        <LogicFeedback
                            feedback={logicFeedback}
                            onDismiss={() => setLogicFeedback(null)}
                        />
                        <SpeechFeedback
                            feedback={speechFeedback}
                            onDismiss={() => setSpeechFeedback(null)}
                        />
                        <ChatBox
                            onEnd={handleEndInterview}
                            onAISpeakingChange={handleAISpeakingChange}
                            onUserSpeakingChange={handleUserSpeakingChange}
                            onLogicFeedback={handleLogicFeedback}
                            onSpeechFeedback={handleSpeechFeedback}
                        />
                    </div>
                </Panel>

            </Group>
        </div>
    );
};
