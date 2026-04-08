import React, { useState, useEffect, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, Cell
} from 'recharts';
import { 
  Activity, Target, MessageSquare, Award, 
  Eye, Zap, Download, ChevronLeft, Sparkles, AlertCircle, Volume2, BookOpen
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api'; 

export function CandidateReport({ analyticsData }: { analyticsData?: any }) {
  const [isBriefing, setIsBriefing] = useState(false);
  const [isRoadmapping, setIsRoadmapping] = useState(false);
  // Feedback now comes initially from backend, but can be refreshed/augmented
  const [feedback, setFeedback] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [score, setScore] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Parse Data from Backend
  const visionMetrics = analyticsData?.vision_analytics || {};
  const nlpMetrics = analyticsData?.nlp_report || {};
  const radarMetrics = analyticsData?.radar_chart_data || {};
  const answerEvaluation = analyticsData?.answer_evaluation || {};
  const backendFeedback = analyticsData?.feedback || null;

  useEffect(() => {
    if (analyticsData) {
        // Calculate Readiness Score
        // Technical Accuracy * 0.45 + Communication * 0.25 + Confidence * 0.20 + Focus * 0.10
        const tech = radarMetrics.technical_accuracy || 0;
        const comm = radarMetrics.communication || 0;
        const conf = radarMetrics.confidence || 0;
        const focus = radarMetrics.focus || 0;
        
        const calculated = Math.round((tech * 0.45) + (comm * 0.25) + (conf * 0.20) + (focus * 0.10));
        setScore(calculated > 100 ? 100 : calculated < 0 ? 0 : calculated);
        
        // Set initial feedback if available from backend
        if (backendFeedback) {
            setFeedback(backendFeedback);
        }
    }
  }, [analyticsData]);

  // Transform Radar Data for Chart
  const radarChartData = [
    { subject: 'Technical', A: radarMetrics.technical_accuracy || 0, fullMark: 100 },
    { subject: 'Communication', A: radarMetrics.communication || 0, fullMark: 100 },
    { subject: 'Confidence', A: radarMetrics.confidence || 0, fullMark: 100 },
    { subject: 'Focus', A: radarMetrics.focus || 0, fullMark: 100 },
    { subject: 'EQ', A: radarMetrics.emotional_intelligence || 0, fullMark: 100 },
  ];

  // Transform Per-Question Metrics for Bar Chart
  const sessionData = visionMetrics.per_question_metrics?.map((m: any, i: number) => ({
      q: `Q${i + 1}`,
      logic: m.confidence, // Using confidence as proxy for logic consistency in visualization
      focus: m.eye_contact_percentage,
      fillers: 0 
  })) || [];

  const fillerWords = nlpMetrics.most_common_fillers?.map(([word, count]: [string, number]) => ({ word, count })) || [];


  // ✨ BACKEND: Smart Study Roadmap
  const generateRoadmap = async () => {
    setIsRoadmapping(true);
    
    // Find weak areas from radar chart or answer evaluation
    const lowMetric = radarChartData.reduce((min, p) => p.A < min.A ? p : min, radarChartData[0]);
    const weakTopics = answerEvaluation.per_category 
        ? Object.entries(answerEvaluation.per_category)
            .filter(([_, data]: [string, any]) => data.accuracy < 6)
            .map(([topic]: [string, any]) => topic)
        : [];

    const focusArea = lowMetric?.subject || "General Interview Skills";

    // Use a hardcoded base URL if API_ENDPOINTS.baseUrl is missing, or construct it from existing endpoints
    const baseUrl = API_ENDPOINTS.analytics ? API_ENDPOINTS.analytics.split('/api')[0] : '';

    try {
      const response = await fetch(`${baseUrl}/api/roadmap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ focus_area: focusArea, weak_topics: weakTopics })
      });
      
      if (response.ok) {
          const data = await response.json();
          setRoadmap(data);
      } else {
          console.error("Roadmap API failed");
      }
    } catch (error) {
      console.error("Roadmap Error:", error);
    } finally {
      setIsRoadmapping(false);
    }
  };

  // ✨ BACKEND: AI Audio Briefing (TTS)
  const playAudioBriefing = async () => {
    if (!feedback) return;
    setIsBriefing(true);
    
    const textToSay = `Here is your interview summary. Great job on ${feedback.strengths}. I noticed some gaps in ${feedback.gaps}. My advice is to ${feedback.advice}. Keep up the good work!`;

    const baseUrl = API_ENDPOINTS.analytics ? API_ENDPOINTS.analytics.split('/api')[0] : '';

    try {
      const response = await fetch(`${baseUrl}/api/audio-brief`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSay })
      });

      if (response.ok) {
          const data = await response.json();
          // Backend returns base64 audio
          const audioSrc = `data:audio/mp3;base64,${data.audio_base64}`;
          
          if (audioRef.current) {
            audioRef.current.src = audioSrc;
            audioRef.current.play();
            audioRef.current.onended = () => setIsBriefing(false);
          }
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsBriefing(false);
    }
  };

  if (!analyticsData) {
      return <div className="text-center text-slate-500 p-10">Loading Analytics...</div>;
  }

  return (
    <div className="bg-void text-ivory font-body p-4 md:p-8 relative overflow-hidden">
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
        <div>
          <button onClick={() => window.history.back()} className="flex items-center text-gold text-xs font-heading font-bold uppercase tracking-widest mb-3 hover:text-gold/80 transition-colors drop-shadow-gold-glow">
            <ChevronLeft size={16} /> Return to Hub
          </button>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-ivory tracking-tight uppercase mb-1">
            Performance <span className="text-gold drop-shadow-gold-glow">Analytics</span>
          </h1>
          <p className="text-muted font-heading text-[10px] uppercase tracking-widest">✨ Powered by Gemini Intelligence</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={playAudioBriefing}
            disabled={!feedback || isBriefing}
            className={`px-6 py-3 rounded-full font-heading text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all ${!feedback ? 'bg-surface/50 text-muted border border-gold/5 cursor-not-allowed' : 'glass-button bg-panel border-gold/20 text-gold hover:bg-gold/10 hover:shadow-gold-glow'}`}
          >
            <Volume2 size={16} className={isBriefing ? 'animate-pulse text-gold' : ''} />
            {isBriefing ? 'Synthesizing...' : 'Audio Brief'}
          </button>
          <button className="glass-button bg-gold hover:bg-gold/90 text-void px-6 py-3 rounded-full font-heading text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:shadow-[0_0_30px_rgba(201,168,76,0.5)]">
            <Download size={16} /> Export Data
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        
        {/* BENTO: Overall Score */}
        <div className="md:col-span-4 glass-panel glow-panel rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group border-gold/20">
            <div className="absolute inset-0 bg-gold/5 blur-[80px] group-hover:bg-gold/10 transition-all duration-700"></div>
            <div className="relative z-10 text-center">
                <div className="relative inline-flex items-center justify-center mb-6">
                    <svg className="w-48 h-48 transform -rotate-90">
                        <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface border-white/5" />
                        <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="8" fill="transparent" 
                            strokeDasharray={540} strokeDashoffset={540 - (540 * score) / 100}
                            className="text-gold transition-all duration-1000 ease-out drop-shadow-gold-glow" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-7xl font-heading font-bold text-ivory tracking-tighter drop-shadow-gold-glow">{score}</span>
                        <span className="font-heading text-[10px] text-gold font-bold uppercase tracking-[0.2em] mt-1">Telemetry</span>
                    </div>
                </div>
                <div className="px-5 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold font-heading text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                  Session Evaluated
                </div>
            </div>
        </div>

        {/* BENTO: Score Breakdown */}
        <div className="md:col-span-4 glass-panel rounded-3xl p-8 border border-gold/10 hover:border-gold/30 transition-all group">
            <h3 className="font-heading text-[11px] font-bold text-gold uppercase tracking-widest mb-8 flex items-center gap-2 drop-shadow-gold-glow">
              <Zap size={14} className="text-gold animate-pulse" /> Metrics Breakdown
            </h3>
            <div className="space-y-6">
                {[
                    { label: 'Technical Accuracy', val: radarMetrics.technical_accuracy || 0, color: '#C9A84C' },
                    { label: 'Communication', val: radarMetrics.communication || 0, color: '#E8DCC0' },
                    { label: 'Confidence', val: radarMetrics.confidence || 0, color: '#D4AF37' },
                    { label: 'Focus & Gaze', val: radarMetrics.focus || 0, color: '#FAF9F6' },
                ].map((item, i) => (
                    <div key={i} className="space-y-3">
                        <div className="flex justify-between font-heading text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-muted">{item.label}</span>
                            <span className="text-ivory" style={{ color: item.color, textShadow: `0 0 10px ${item.color}40` }}>{item.val}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface/50 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.val}%`, backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* BENTO: Quick Stats & Filler Words */}
        <div className="md:col-span-4 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center border-gold/10 hover:border-gold/30 transition-all">
                    <Eye className="text-ivory mb-3" size={24} />
                    <span className="text-3xl font-heading font-bold text-ivory mb-1" style={{ textShadow: '0 0 15px rgba(250, 249, 246, 0.4)' }}>{Math.round(radarMetrics.focus || 0)}%</span>
                    <span className="font-heading text-[9px] text-muted font-bold uppercase tracking-widest">Eye Contact</span>
                </div>
                <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center border-gold/10 hover:border-gold/30 transition-all">
                    <Award className="text-gold mb-3" size={24} />
                    <span className="text-3xl font-heading font-bold text-ivory mb-1 drop-shadow-gold-glow">{Math.round(radarMetrics.confidence || 0)}%</span>
                    <span className="font-heading text-[9px] text-muted font-bold uppercase tracking-widest">Confidence</span>
                </div>
            </div>
            
            <div className="glass-panel rounded-3xl p-6 flex-1 border-gold/10 hover:border-gold/30 transition-all">
                <h4 className="font-heading text-[10px] font-bold text-muted uppercase tracking-widest mb-5">Frequent Disruptions</h4>
                <div className="flex flex-wrap gap-2">
                    {fillerWords.length > 0 ? fillerWords.map((f: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-surface/50 border border-gold/10 px-3 py-1.5 rounded-lg group hover:border-gold/40 transition-colors">
                            <span className="font-heading text-xs font-bold text-muted group-hover:text-ivory">"{f.word}"</span>
                            <span className="font-heading text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded border border-gold/20">{f.count}</span>
                        </div>
                    )) : <span className="font-heading text-xs text-muted italic">Clear communication detected.</span>}
                </div>
            </div>
        </div>

        {/* MIDDLE ROW: Radar & Dynamic Bar Chart */}
        <div className="md:col-span-6 glass-panel rounded-3xl p-8 border border-gold/10 hover:border-gold/30 transition-all">
          <h3 className="font-heading text-[11px] font-bold text-ivory uppercase tracking-widest mb-8 flex items-center gap-2" style={{ textShadow: '0 0 10px rgba(250,249,246,0.4)'}}>
            <Target size={14} className="text-ivory" /> Vector Analysis
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                <PolarGrid stroke="rgba(201, 168, 76, 0.15)" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Outfit' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Proficiency"
                  dataKey="A"
                  stroke="#E8DCC0"
                  strokeWidth={2}
                  fill="#E8DCC0"
                  fillOpacity={0.2}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.8)', border: '1px solid rgba(232, 220, 192, 0.2)', borderRadius: '12px', backdropFilter: 'blur(8px)', fontFamily: 'Outfit', fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-6 glass-panel rounded-3xl p-8 border border-gold/10 hover:border-gold/30 transition-all">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-heading text-[11px] font-bold text-gold uppercase tracking-widest flex items-center gap-2 drop-shadow-gold-glow">
              <Activity size={14} className="text-gold" /> Event Timeline
            </h3>
            <span className="font-heading text-[10px] font-bold text-muted uppercase tracking-widest border border-white/5 bg-surface/50 px-2 py-1 rounded">Q1 - Q{sessionData.length}</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="q" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Outfit' }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'rgba(201, 168, 76, 0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '12px', backdropFilter: 'blur(8px)', fontFamily: 'Outfit', fontSize: '10px' }}
                />
                <Bar dataKey="logic" radius={[4, 4, 0, 0]} barSize={24}>
                  {sessionData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#C9A84C' : '#D4AF37'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM ROW: AI Feedback Generation */}
        <div className="md:col-span-12 glass-panel glow-panel rounded-3xl p-8 overflow-hidden relative border-gold/20">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={120} className="text-gold animate-pulse" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h3 className="font-heading text-2xl font-bold text-ivory flex items-center gap-3 drop-shadow-gold-glow">
                  <Sparkles size={24} className="text-gold" /> ✨ Intelligence Synthesis
                </h3>
                <p className="font-heading text-[10px] text-muted mt-2 tracking-widest uppercase">Deep reasoning analysis powered by Gemini Flash.</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                    onClick={generateRoadmap}
                    disabled={isRoadmapping}
                    className="flex-1 md:flex-none glass-button hover:shadow-[0_0_15px_rgba(232,220,192,0.3)] bg-[#E8DCC0]/10 hover:bg-[#E8DCC0]/20 text-ivory border border-[#E8DCC0]/30 px-8 py-3 rounded-full font-heading font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <BookOpen size={16} />
                    {isRoadmapping ? "Mapping..." : "✨ Generate Roadmap"}
                </button>
              </div>
            </div>

            {/* Content Display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Feedback Panel */}
                <div className="md:col-span-8">
                    {!feedback && (
                        <div className="glass-panel border-dashed border-gold/20 rounded-3xl p-12 text-center bg-surface/30">
                            <MessageSquare className="mx-auto text-gold/50 mb-4 animate-pulse" size={48} />
                            <p className="text-gold font-heading font-bold uppercase tracking-widest text-[10px]">Processing Telemetry Context...</p>
                        </div>
                    )}

                    {feedback && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="glass-panel bg-gold/5 border border-gold/20 p-6 rounded-3xl hover:border-gold/40 transition-colors">
                                <h4 className="text-gold font-heading font-bold text-[10px] uppercase mb-4 flex items-center gap-2 tracking-widest drop-shadow-gold-glow">
                                    <Award size={14} /> Core Strengths
                                </h4>
                                <p className="font-body text-sm text-ivory leading-relaxed">{feedback.strengths}</p>
                            </div>
                            <div className="glass-panel bg-status-red/5 border border-status-red/20 p-6 rounded-3xl hover:border-status-red/40 transition-colors">
                                <h4 className="text-ivory font-heading font-bold text-[10px] uppercase mb-4 flex items-center gap-2 tracking-widest" style={{ textShadow: '0 0 10px rgba(250,249,246,0.4)' }}>
                                    <AlertCircle size={14} /> Critical Gaps
                                </h4>
                                <p className="font-body text-sm text-ivory leading-relaxed">{feedback.gaps}</p>
                            </div>
                            <div className="glass-panel bg-surface/50 border border-white/5 p-6 rounded-3xl hover:border-white/20 transition-colors">
                                <h4 className="text-muted font-heading font-bold text-[10px] uppercase mb-4 flex items-center gap-2 tracking-widest">
                                    <Target size={14} /> Intelligence Advice
                                </h4>
                                <p className="font-body text-sm text-muted leading-relaxed">{feedback.advice}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Roadmap Panel */}
                <div className="md:col-span-4 h-full">
                    <div className="glass-panel bg-surface/30 border border-gold/10 hover:border-gold/30 transition-colors rounded-3xl p-6 h-full min-h-[200px]">
                        <h4 className="text-ivory font-heading font-bold text-[11px] uppercase mb-6 flex items-center gap-2 tracking-widest">
                            ✨ Execution Plan
                        </h4>
                        {!roadmap && !isRoadmapping && (
                            <div className="flex flex-col items-center justify-center h-48 opacity-40 text-gold">
                                <BookOpen size={32} className="mb-3 animate-pulse" />
                                <p className="font-heading text-[10px] font-bold tracking-widest uppercase">Awaiting instruction</p>
                            </div>
                        )}
                        {isRoadmapping && (
                            <div className="animate-pulse space-y-4">
                                {[...Array(5)].map((_, i) => <div key={i} className="h-3 bg-gold/10 rounded w-full border border-gold/5"></div>)}
                            </div>
                        )}
                        {roadmap && (
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {Object.entries(roadmap).map(([day, task], i) => (
                                    <div key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                        <span className="text-gold font-heading font-bold uppercase tracking-widest text-[9px] block mb-1.5">{day}</span>
                                        <p className="font-body text-muted text-xs leading-relaxed">{task as string}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>

      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(201, 168, 76, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(201, 168, 76, 0.5); }
      `}</style>
      <div className="absolute bottom-2 right-4 font-heading text-[9px] text-white/10 uppercase tracking-widest">
          SYS.VER :: 2.2 Intelligent
      </div>

    </div>
  );
};
