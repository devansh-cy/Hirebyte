import React, { useState, useEffect } from 'react';
import { WelcomeModal } from '../components/WelcomeModal';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/Auth/LoginModal';
import { Navbar } from '../components/Layout/Navbar';
import { LandingHero } from '../components/Home/LandingHero';
import { SocialProofBar } from '../components/Home/SocialProofBar';
import { FeaturesSection } from '../components/Home/FeaturesSection';
import { HowItWorksSection } from '../components/Home/HowItWorksSection';
import { PhilosophySection } from '../components/Home/PhilosophySection';
import { StatsSection } from '../components/Home/StatsSection';
import { TestimonialsSection } from '../components/Home/TestimonialsSection';
import { FAQSection } from '../components/Home/FAQSection';
import { FinalCTA } from '../components/Home/FinalCTA';
import { Footer } from '../components/Layout/Footer';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
        return localStorage.getItem('welcomeConsent') !== 'true';
    });
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Force document body style for landing page
    useEffect(() => {
        document.body.style.backgroundColor = '#020617'; // void
        return () => {
            document.body.style.backgroundColor = ''; 
        };
    }, []);

    const handleStart = () => navigate('/setup');

    return (
        <div className="bg-void min-h-screen font-body w-full overflow-x-hidden">
            <Navbar onLoginClick={() => setShowLoginModal(true)} />
            
            <LandingHero onStart={handleStart} />
            <SocialProofBar />
            <FeaturesSection />
            <HowItWorksSection />
            <PhilosophySection />
            <StatsSection />
            <TestimonialsSection />
            <FAQSection />
            <FinalCTA onStart={handleStart} />
            <Footer />

            <WelcomeModal
                isOpen={showWelcomeModal}
                onAgree={() => setShowWelcomeModal(false)}
            />
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />
        </div>
    );
};
