import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CandidateReport } from '../components/Analytics/CandidateReport';
import { API_ENDPOINTS } from '../config/api';
import { ArrowLeft } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [searchParams] = useSearchParams();

    // Simplified useEffect - no history fetching
    useEffect(() => {
        const directId = searchParams.get('id');
        if (directId) {
            handleViewReport(directId);
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    const handleViewReport = async (id: string) => {
        setLoading(true);
        try {
            // Fetch analytics (current session only essentially, or direct ID if we kept that valid)
            // Since history is gone, this is mostly for the immediate post-interview redirect
            const endpoint = id === 'current' || !id
                ? `${API_ENDPOINTS.analytics}`
                : `${API_ENDPOINTS.analytics}`; // Fallback to current session always since history endpoints are gone

            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
                setSelectedId("current");
            }
        } catch (error) {
            console.error('Failed to fetch report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-void flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(201,168,76,0.5)]" />
                    <p className="font-heading text-sm text-gold animate-pulse tracking-widest uppercase">Processing Telemetry...</p>
                </div>
            </div>
        );
    }

    // Detail View
    if (selectedId && reportData) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-void">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-gold transition-colors bg-panel glass-panel border border-gold/10 hover:border-gold/30 rounded-xl"
                    >
                        <ArrowLeft size={16} /> <span className="font-heading tracking-widest uppercase text-xs font-bold">Return to Hub</span>
                    </button>
                    <CandidateReport analyticsData={reportData} />
                </div>
            </div>
        );
    }

    // List View - REMOVED HISTORY
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-void p-6 flex flex-col items-center justify-center overflow-hidden relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="text-center relative z-10 glass-panel glow-panel rounded-3xl p-12 max-w-2xl w-full border-gold/20 shadow-[0_0_30px_rgba(201,168,76,0.1)]">
                <h1 className="text-4xl font-heading font-bold text-ivory mb-4 drop-shadow-gold-glow flex items-center justify-center gap-4">
                    Session Analytics
                </h1>
                <p className="font-body text-muted mb-8">
                    Your interview reports are available immediately after each session.
                    Please start a new interview to generate analytical telemetry.
                </p>
                {/* Debug Info for User */}
                <p className="font-heading text-xs text-status-red mb-6 bg-status-red/10 px-3 py-1.5 rounded-full inline-block border border-status-red/20 uppercase tracking-widest">
                    SYS.ERR: No telemetry data found
                </p>

                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={() => navigate('/setup')}
                        className="px-8 py-4 glass-button bg-gold text-void font-heading font-bold tracking-widest uppercase rounded-full hover:bg-gold-light transition-all shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:shadow-[0_0_30px_rgba(201,168,76,0.5)]"
                    >
                        Initialize New Session
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="text-xs font-heading tracking-widest uppercase text-muted hover:text-gold transition-colors"
                    >
                        Return to Hub
                    </button>
                </div>
            </div>
        </div>
    );
};
