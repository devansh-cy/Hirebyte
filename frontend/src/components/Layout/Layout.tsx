import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAnimation } from '../../context/AnimationContext';

interface LayoutProps {
  children: React.ReactNode;
  onDone?: () => void;
  showDoneButton?: boolean;
  showLoginButton?: boolean;
  onLoginClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, showLoginButton = false, onLoginClick }) => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { showContent } = useAnimation();

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Header - Only show if NOT on landing page */}
      {!isLandingPage && (
        <header 
          className="h-16 border-b border-border-dim bg-panel/80 backdrop-blur-xl sticky top-0 z-50 px-6 flex items-center justify-between transition-all duration-700 ease-out"
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(-20px)',
          }}
        >
          <a href="/" className="flex items-center gap-3 font-display font-bold text-2xl cursor-pointer transition-opacity group">
            <span className="text-ivory tracking-wide">Hire<span className="text-gold">Byte</span></span>
          </a>

        {/* Right side buttons - opposite to HireByte logo */}
        <div className="flex items-center gap-3">


          {/* Auth Section */}
          {user ? (
            <div className="flex items-center gap-2">


              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 border border-gold text-gold hover:bg-gold/10 transition-all px-4 py-1.5 rounded-full"
                >
                  <div className="text-gold">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-mono truncate max-w-[120px]">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-3 w-56 glass-card overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-xs font-mono text-muted">SIGNED IN AS</p>
                      <p className="text-sm font-body truncate text-ivory mt-1" title={user.email}>{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-status-red hover:bg-status-red/10 flex items-center gap-3 transition-colors font-mono"
                    >
                      <LogOut size={16} />
                      TERMINATE SESSION
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            showLoginButton && (
              <button
                onClick={onLoginClick}
                className="bg-gold text-void hover:bg-gold-light transition-all shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:shadow-[0_0_40px_rgba(201,168,76,0.5)] font-semibold px-6 py-2 rounded-full text-sm font-heading tracking-wide"
              >
                LOGIN
              </button>
            )
          )}
        </div>
      </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden" >
        <div 
          className="h-full w-full transition-all duration-700 ease-out"
          style={{
            opacity: showContent || isLandingPage ? 1 : 0,
            transform: showContent || isLandingPage ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};
