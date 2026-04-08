import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
    isOpen: boolean;
    onAgree: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onAgree }) => {
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsChecked(false);
        }
    }, [isOpen]);

    const handleAgree = () => {
        if (isChecked) {
            localStorage.setItem('welcomeConsent', 'true');
            localStorage.setItem('welcomeConsentDate', new Date().toISOString());
            onAgree();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
                    />

                    {/* Modal - Centered at top */}
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-lg px-4"
                    >
                        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black border border-hirebyte-mint/40 rounded-3xl p-8 shadow-2xl shadow-hirebyte-mint/20">
                            {/* Header with icon */}
                            <div className="text-center mb-6">
                                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-hirebyte-mint/20 to-hirebyte-blue/20 mb-4">
                                    <Sparkles size={40} className="text-hirebyte-mint" />
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    Welcome to <span className="text-hirebyte-mint">HireByte</span>
                                </h1>
                                <p className="text-gray-400">
                                    Your AI-Powered Interview Practice Platform
                                </p>
                            </div>

                            {/* Info Box */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    HireByte uses AI to simulate real interview experiences. We'll use your 
                                    <span className="text-hirebyte-mint font-medium"> camera</span> and 
                                    <span className="text-hirebyte-mint font-medium"> microphone</span> to analyze 
                                    your responses, body language, and confidence in real-time.
                                </p>
                            </div>

                            {/* Privacy Note */}
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-hirebyte-blue/10 border border-hirebyte-blue/30 mb-6">
                                <Shield size={20} className="text-hirebyte-blue-light mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-gray-400">
                                    <span className="text-white font-medium">Privacy First:</span> All processing 
                                    happens locally. No data is stored or shared externally. This is a practice tool only.
                                </p>
                            </div>

                            {/* Checkbox */}
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors mb-6 group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => setIsChecked(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${
                                        isChecked 
                                            ? 'bg-hirebyte-mint border-hirebyte-mint' 
                                            : 'border-gray-500 group-hover:border-hirebyte-mint/50'
                                    }`}>
                                        {isChecked && (
                                            <motion.svg
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-4 h-4 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </motion.svg>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-white">
                                    I understand and agree to proceed
                                </span>
                            </label>

                            {/* CTA Button */}
                            <button
                                onClick={handleAgree}
                                disabled={!isChecked}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                                    isChecked
                                        ? 'bg-gradient-to-r from-hirebyte-mint to-emerald-500 text-white hover:from-emerald-500 hover:to-hirebyte-mint shadow-lg shadow-hirebyte-mint/30 cursor-pointer'
                                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                Get Started
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
