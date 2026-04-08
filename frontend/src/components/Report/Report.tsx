import { useEffect, useState } from 'react';
import { Sparkles, Download, Share2, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { API_BASE_URL } from '../../config';

interface ReportProps {
    onRestart: () => void;
    chatHistory: { role: string, text: string }[];
    jobDescription: string;
}

interface ReportData {
    score: number;
    technical_accuracy: number;
    communication: number;
    strengths: string[];
    weaknesses: string[];
    summary: string;
}

export function Report({ onRestart, chatHistory, jobDescription }: ReportProps) {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/generate-report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_history: chatHistory,
                        job_description: jobDescription
                    }),
                });

                if (!response.ok) throw new Error("Failed to generate report");

                const data = await response.json();
                setReportData(data);
            } catch (err) {
                console.error(err);
                setError("Could not generate report. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [chatHistory, jobDescription]);

    const handleDownloadPDF = () => {
        const element = document.getElementById('report-content');
        const opt = {
            margin: 1,
            filename: 'interview-report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        // @ts-ignore
        html2pdf().set(opt).from(element).save();
    };

    const handleShare = async () => {
        if (!reportData) return;

        const shareData = {
            title: 'My Interview Result',
            text: `I just completed an AI interview with a score of ${reportData.score}/100!`,
            url: window.location.href
        };

        const copyToClipboard = async () => {
            try {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                alert('Result copied to clipboard!');
            } catch (clipboardErr) {
                console.error('Clipboard failed:', clipboardErr);
                alert('Could not share or copy to clipboard.');
            }
        };

        try {
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (shareErr) {
                    if ((shareErr as Error).name !== 'AbortError') {
                        console.error('Share API failed, trying clipboard:', shareErr);
                        await copyToClipboard();
                    }
                }
            } else {
                await copyToClipboard();
            }
        } catch (err) {
            console.error('General share error:', err);
            alert('Something went wrong with sharing.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse" />
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Generating Analysis...</h2>
                    <p className="text-gray-400">AI is reviewing your interview performance</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <p className="text-xl text-red-400">{error}</p>
                <button
                    onClick={onRestart}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                    Return Home
                </button>
            </div>
        );
    }

    if (!reportData) return null;

    return (
        <div id="report-content" className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    <span>Interview Completed</span>
                </div>
                <h1 className="text-4xl font-bold text-white">Interview Report</h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                    {reportData.summary}
                </p>
            </div>

            {/* Main Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-[#161616] rounded-2xl border border-white/5 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-32 h-32 text-blue-500" />
                    </div>

                    <h3 className="text-lg font-medium text-gray-300 mb-6">Overall Score</h3>
                    <div className="flex items-end gap-4">
                        <span className="text-6xl font-bold text-white">{reportData.score}</span>
                        <span className="text-xl text-gray-500 mb-2">/ 100</span>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Technical Accuracy</span>
                                <span className="text-white">{reportData.technical_accuracy}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${reportData.technical_accuracy}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Communication</span>
                                <span className="text-white">{reportData.communication}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${reportData.communication}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                    <div className="bg-[#161616] p-6 rounded-2xl border border-white/5">
                        <h4 className="text-sm text-gray-400 mb-2">Questions Discussed</h4>
                        <p className="text-2xl font-bold text-white">{chatHistory.filter(m => m.role === 'ai').length}</p>
                    </div>
                    <div className="bg-[#161616] p-6 rounded-2xl border border-white/5">
                        <h4 className="text-sm text-gray-400 mb-2">Focus</h4>
                        <p className="text-lg font-bold text-white truncate" title={jobDescription}>
                            {jobDescription.split(' ').slice(0, 3).join(' ')}...
                        </p>
                    </div>
                </div>
            </div>

            {/* Feedback Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#161616] rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <h3 className="font-semibold">Strengths</h3>
                    </div>
                    <ul className="space-y-3">
                        {reportData.strengths.map((item, i) => (
                            <li key={i} className="flex gap-3 text-gray-300 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-[#161616] rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4 text-yellow-500">
                        <AlertCircle className="w-5 h-5" />
                        <h3 className="font-semibold">Areas for Improvement</h3>
                    </div>
                    <ul className="space-y-3">
                        {reportData.weaknesses.map((item, i) => (
                            <li key={i} className="flex gap-3 text-gray-300 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-4 pt-8">
                <button
                    onClick={onRestart}
                    className="px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Start New Interview
                </button>
                <button
                    onClick={handleDownloadPDF}
                    className="px-6 py-3 bg-[#161616] text-white font-semibold rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Download PDF
                </button>
                <button
                    onClick={handleShare}
                    className="px-6 py-3 bg-[#161616] text-white font-semibold rounded-xl border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                    <Share2 className="w-4 h-4" />
                    Share Result
                </button>
            </div>

        </div>
    );
}
