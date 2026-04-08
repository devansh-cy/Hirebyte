import React, { useState, useRef, useCallback } from 'react';
import { Activity, Smile, Brain, Hand, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { WS_ENDPOINTS } from '../../config/api';
import { AIAssistanceBadge } from '../AIAssistanceBadge';

interface VideoAnalysisProps {
    onReady?: () => void;
    isAISpeaking?: boolean;
    isUserSpeaking?: boolean;
    currentHint?: string | null;
}

export const VideoAnalysis: React.FC<VideoAnalysisProps> = ({
    onReady,
    isAISpeaking = false,
    isUserSpeaking = false,
    currentHint = null
}) => {
    const webcamRef = useRef<Webcam>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    // Smoothed metrics state with exponential moving average
    const [smoothedMetrics, setSmoothedMetrics] = useState({
        focus: 50,
        emotion: 50,
        confidence: 50,
        stress: 50,
    });


    // Smoothing factor (0.3 = 30% new value, 70% old value)
    const SMOOTHING_FACTOR = 0.3;

    // Apply exponential moving average for smoother transitions
    const smoothValue = (oldVal: number, newVal: number) =>
        Math.round(oldVal * (1 - SMOOTHING_FACTOR) + newVal * SMOOTHING_FACTOR);

    // Timer effect
    React.useEffect(() => {
        const timer = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Stop interview on 'Esc' key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                window.location.reload();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // WebSocket connection and frame sending
    React.useEffect(() => {
        if (onReady) onReady();

        const ws = new WebSocket(WS_ENDPOINTS.video);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected for video analysis");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Apply smoothing to metrics for natural transitions
                setSmoothedMetrics(prev => ({
                    focus: smoothValue(prev.focus, data.focus || 0),
                    emotion: smoothValue(prev.emotion, data.emotion || 0),
                    confidence: smoothValue(prev.confidence, data.confidence || 0),
                    stress: smoothValue(prev.stress, data.stress || 0),
                }));
            } catch (e) {
                console.error("Metric Parse Error", e);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
            console.log("WebSocket closed");
            setIsConnected(false);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [onReady]);

    // Capture and send frames at interval
    const captureFrame = useCallback(() => {
        if (webcamRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                // Send base64 image to backend
                wsRef.current.send(imageSrc);
            }
        }
    }, []);

    // Send frames every 100ms (10 FPS) for analysis
    React.useEffect(() => {
        const frameInterval = setInterval(captureFrame, 100);
        return () => clearInterval(frameInterval);
    }, [captureFrame]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full min-h-0 gap-4">
            {/* Main Video Card - Neon Theme */}
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-void ring-1 ring-gold/30 shadow-[0_0_20px_rgba(201,168,76,0.1)] group">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: "user"
                    }}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    mirrored={true}
                />

                {/* Left: LIVE indicator */}
                <div className="absolute top-4 left-4">
                    <div className={`backdrop-blur-md bg-panel/80 glass-panel px-3 py-1.5 rounded flex items-center gap-2 font-heading text-xs font-bold tracking-widest ${isConnected ? 'text-status-red' : 'text-muted'}`}>
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-status-red' : 'bg-surface'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-status-red' : 'bg-surface'}`}></span>
                        </span>
                        [{isConnected ? 'LIVE' : 'WAIT'}]
                    </div>
                </div>

                {/* Right: AI Badge + Timestamp */}
                <div className="absolute top-4 right-4 flex items-center gap-3">
                    <AIAssistanceBadge isConnected={isConnected} />
                    <div className="bg-panel border border-gold/20 backdrop-blur-md px-3 py-1 rounded text-gold font-heading text-sm tracking-widest">
                        {formatTime(elapsed)}
                    </div>
                </div>

                {/* Dynamic Overlay Messages */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isAISpeaking ? 'ai' : isUserSpeaking ? 'user' : 'hint'}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-auto min-w-[300px] max-w-md z-20"
                    >
                        {isAISpeaking ? (
                            <div className="bg-panel/80 glass-panel rounded-xl px-5 py-3 shadow-[0_0_20px_rgba(201,168,76,0.2)] flex items-center gap-4 border border-gold/30">
                                <div className="p-2 bg-gold/10 rounded-lg text-gold animate-pulse">
                                    <Activity size={20} />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="font-heading text-sm font-bold text-ivory tracking-widest uppercase">AI Speaking</p>
                                    <p className="font-body text-xs text-[#7A6A53]">Analyzing current trajectory...</p>
                                </div>
                            </div>
                        ) : isUserSpeaking ? (
                            <div className="bg-surface/80 glass-panel rounded-xl px-5 py-3 shadow-[0_0_20px_rgba(201,168,76,0.2)] flex items-center gap-4 border border-gold/40">
                                <div className="p-2 bg-gold/20 rounded-lg text-gold">
                                    <Hand size={20} />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="font-heading text-sm font-bold text-ivory tracking-widest uppercase">Sensors Active</p>
                                    <p className="font-body text-xs text-[#7A6A53]">Maintaining steady input stream.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-panel/80 glass-panel rounded-xl px-5 py-3 shadow-[0_0_20px_rgba(201,168,76,0.1)] flex items-center gap-4 border border-gold/20">
                                <div className="p-2 bg-gold/5 rounded-lg text-gold">
                                    <Sparkles size={20} />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="font-heading text-base font-bold text-ivory tracking-widest">
                                        {currentHint ? "SYS.OVERRIDE" : "AWAITING INPUT"}
                                    </p>
                                    <p className="font-body text-xs text-[#7A6A53] leading-snug">
                                        {currentHint || "Mic is primed. Send audio response when ready."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Metrics Panel - Using smoothed values */}
            <div className="shrink-0 grid grid-cols-3 gap-3">
                <MetricCard
                    label="Emotion"
                    value={smoothedMetrics.emotion}
                    icon={<Smile size={14} />}
                    color="text-gold"
                    barColor="bg-gold"
                />
                <MetricCard
                    label="Focus"
                    value={smoothedMetrics.focus}
                    icon={<Activity size={14} />}
                    color="text-ivory"
                    barColor="bg-ivory"
                />
                <MetricCard
                    label="Confidence"
                    value={smoothedMetrics.confidence}
                    icon={<Brain size={14} />}
                    color="text-[#7A6A53]"
                    barColor="bg-[#7A6A53]"
                />
            </div>
        </div>
    );
};

interface MetricCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    barColor: string;
}

const MetricCard = ({ label, value, icon, color, barColor }: MetricCardProps) => (
    <div className="glass-panel glow-panel rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between font-heading text-xs text-muted font-bold tracking-widest uppercase">
            <span className="flex items-center gap-2">{icon} {label}</span>
            <span className={color}>{value}%</span>
        </div>
        <div className="h-1.5 bg-surface/80 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full ${barColor} rounded-full`}
            />
        </div>
    </div>
);
