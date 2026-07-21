import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { LoginModal } from './components/Auth/LoginModal';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from './config/api';
import { useState, useEffect, lazy, Suspense } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { CustomCursor } from './components/Layout/CustomCursor';
import ParticleField from './components/ParticleField';
import PageLoader from './components/PageLoader';
import { AnimationProvider } from './context/AnimationContext';

// Pages - Lazy loaded for bundle size optimization
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const SetupPage = lazy(() => import('./pages/SetupPage').then(m => ({ default: m.SetupPage })));
const InterviewPage = lazy(() => import('./pages/InterviewPage').then(m => ({ default: m.InterviewPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));

// Wrapper for Layout to handle location-based props
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Global Page Loader state
  const [loaded, setLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const handleLoaderComplete = () => {
    setLoaded(true);
    setTimeout(() => setShowContent(true), 1500);
  };

  // Determine props for Layout based on current path
  const showLoginButton = location.pathname === '/';
  const showDoneButton = location.pathname === '/interview';

  useEffect(() => {
    // Standard setup from Lenis docs integrated with GSAP ticker
    const lenis = new Lenis({ 
      duration: 1.2, 
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) 
    });
    
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleEndInterview = async () => {
    try {
      await fetch(API_ENDPOINTS.stopCamera, { method: 'POST' });

      if (user) {
        await fetch(`${API_ENDPOINTS.analytics}/../session/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
        });
      }
    } catch (error) {
      console.error('Error ending interview:', error);
    }
    navigate('/analytics');
  };

  return (
    <AnimationProvider value={{ loaded, showContent }}>
      <CustomCursor />
      
      {!loaded && <PageLoader onComplete={handleLoaderComplete} />}
      
      <div style={{ position: 'relative' }}>
        <ParticleField />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Layout
            showLoginButton={showLoginButton}
            showDoneButton={showDoneButton}
            onLoginClick={handleLoginClick}
            onDone={handleEndInterview}
          >
            {children}
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
          </Layout>
        </div>
      </div>
    </AnimationProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
            <Suspense fallback={
              <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 text-gold/60 font-heading text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
                Initializing System View...
              </div>
            }>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/interview" element={<InterviewPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;