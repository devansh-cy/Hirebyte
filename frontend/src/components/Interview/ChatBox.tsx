import { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import { API_ENDPOINTS, WS_ENDPOINTS } from '../../config/api';

interface Message {
  role: 'ai' | 'user';
  text: string;
}

interface ChatBoxProps {
  onEnd: () => void;
  onAISpeakingChange?: (speaking: boolean) => void;
  onUserSpeakingChange?: (speaking: boolean) => void;
  onLogicFeedback?: (feedback: { issue_type: string; feedback: string; severity: string }) => void;
  onSpeechFeedback?: (feedback: { wpm: number; pace: string; filler_count: number; confidence_level: string; long_silence: boolean; feedback: string }) => void;
}

export function ChatBox({ onAISpeakingChange, onUserSpeakingChange, onLogicFeedback, onSpeechFeedback }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTranscribing]);

  useEffect(() => {
    const ws = new WebSocket(WS_ENDPOINTS.interview);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected.");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ai_turn') {
          setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
          if (data.audio) {
            setCurrentAudio(data.audio);
            // Notify parent that AI is speaking
            onAISpeakingChange?.(true);
            // Auto-clear after estimated speaking time (3s per 50 chars)
            const speakDuration = Math.max(3000, (data.text.length / 50) * 3000);
            setTimeout(() => onAISpeakingChange?.(false), speakDuration);
          }
        } else if (data.type === 'logic_feedback') {
          // Feature 2: Forward logic feedback to parent
          onLogicFeedback?.({
            issue_type: data.issue_type,
            feedback: data.feedback,
            severity: data.severity
          });
        } else if (data.type === 'speech_feedback') {
          // Feature 4: Forward speech feedback to parent
          onSpeechFeedback?.({
            wpm: data.wpm,
            pace: data.pace,
            filler_count: data.filler_count,
            confidence_level: data.confidence_level,
            long_silence: data.long_silence,
            feedback: data.feedback
          });
        }
      } catch (e) {
        console.error("Error parsing WS message:", e);
      }
    };

    ws.onclose = () => setIsConnected(false);

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => setMediaStream(stream))
      .catch(err => console.error("Error accessing microphone:", err));

    return () => {
      ws.close();
      mediaStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleRecording = () => {
    if (!mediaStream) {
      alert("Microphone not found.");
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      onUserSpeakingChange?.(false);
    } else {
      const recorder = new MediaRecorder(mediaStream);
      audioChunksRef.current = [];
      recordingStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const duration = (Date.now() - recordingStartRef.current) / 1000;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) await sendVoice(audioBlob, duration);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      onUserSpeakingChange?.(true);
    }
  };

  const sendVoice = async (blob: Blob, duration: number = 0) => {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append('file', blob);

    try {
      const res = await fetch(API_ENDPOINTS.transcribe, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Transcription failed");
      const data = await res.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: 'user', text: data.text }]);
        socketRef.current?.send(JSON.stringify({
          type: 'user_turn',
          text: data.text,
          duration: duration,       // Feature 4: speech duration
          silence_duration: 0       // Could be tracked via VAD in future
        }));
      }
    } catch (error) {
      console.error("Error sending voice:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: inputText }]);
    socketRef.current?.send(JSON.stringify({ type: 'user_turn', text: inputText }));
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full glass-panel glow-panel rounded-2xl overflow-hidden shadow-lg border-gold/20">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-gold/10 flex justify-between items-center bg-panel/70 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-gold animate-pulse drop-shadow-[0_0_8px_rgba(201,168,76,0.6)]' : 'bg-status-red'}`} />
          <span className="font-heading font-bold tracking-widest uppercase text-ivory text-sm">Live Transcript</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gold/5 border border-gold/20 rounded-full">
          <span className="font-heading text-xs text-muted tracking-widest uppercase">LLM:</span>
          <span className="font-heading text-xs font-bold text-gold tracking-widest">GPT-4o</span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth chat-scroll">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full opacity-30 text-center text-sm font-body text-ivory">
                AI conversation will appear here...
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    x: m.role === 'ai' ? -40 : 40,
                    y: 10,
                    scale: 0.95,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 24,
                    delay: 0.05,
                  }}
                  className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`p-4 rounded-2xl text-sm max-w-[90%] font-body leading-relaxed border ${m.role === 'ai'
                    ? 'bg-panel/90 text-gold border-gold/20 rounded-tl-none shadow-[0_0_15px_rgba(201,168,76,0.1)]'
                    : 'bg-surface text-ivory border-gold/10 rounded-tr-none shadow-md'
                    }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isTranscribing && (
              <div className="flex justify-end">
                <div className="font-heading text-xs text-gold animate-pulse bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-full flex items-center gap-2 tracking-widest uppercase">
                  Processing Audio...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-4 bg-panel/70 border-t border-gold/10 flex items-center gap-3 backdrop-blur-md">
            <button
              onClick={toggleRecording}
              disabled={isTranscribing || !mediaStream}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${!isRecording
                ? 'bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 hover:shadow-[0_0_15px_rgba(201,168,76,0.3)]'
                : 'bg-status-red text-void animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-status-red/50'
                } ${(!mediaStream || isTranscribing) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              {!isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isRecording}
              className="flex-1 bg-surface/80 border border-gold/10 rounded-full px-5 py-3 text-sm font-body text-ivory outline-none focus:border-gold focus:shadow-[0_0_15px_rgba(201,168,76,0.2)] transition-all placeholder:text-muted/60 disabled:opacity-50"
              placeholder={isRecording ? "Transmitting audio signal..." : "Input terminal command..."}
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isRecording}
              className="w-12 h-12 flex items-center justify-center bg-gold hover:bg-gold-light text-void disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-all shadow-[0_0_15px_rgba(201,168,76,0.3)] hover:shadow-[0_0_20px_rgba(201,168,76,0.5)]"
            >
              <Send size={20} className={inputText.trim() && !isRecording ? "translate-x-0.5" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Audio Player for playback */}
      <div className="hidden">
        <AudioPlayer base64Audio={currentAudio} />
      </div>
    </div>
  );
}