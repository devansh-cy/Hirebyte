
import { useState } from 'react';
import { X, Loader2, Mail, CheckCircle, User, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
    const [isSignUp, setIsSignUp] = useState(false); // Default to Login
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        if (isSignUp && !name) return; // Name is required only for Sign Up

        setIsSubmitting(true);
        setError(null);

        try {
            let error;
            if (isSignUp) {
                // Sign Up logic
                const res = await signUpWithEmail(email, password, name);
                error = res.error;
            } else {
                // Sign In logic
                const res = await signInWithEmail(email, password);
                error = res.error;
            }

            if (error) throw error;

            // For email/password, success usually means logged in (unless email confirmation is strictly enforced)
            // But we can show a success message or close the modal if auto-logged in
            if (isSignUp) {
                setIsSuccess(true); // Show check email message if confirmation required, or just close
            } else {
                onClose(); // Close modal on successful login
            }

        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold mb-2">
                        {isSignUp ? 'Create an Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {isSignUp
                            ? 'Enter your details to get started with HireByte'
                            : 'Sign in to access your interview history'}
                    </p>
                </div>

                {isSuccess ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Check your email</h3>
                        <p className="text-muted-foreground mb-6">
                            We've sent a magic link to <span className="font-medium text-foreground">{email}</span>.
                            <br />Click the link to {isSignUp ? 'sign up' : 'log in'}.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => signInWithGoogle()}
                            className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignUp && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-input rounded-xl focus:ring-2 focus:ring-hirebyte-mint/20 focus:border-hirebyte-mint outline-none transition-all"
                                            required={isSignUp}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-input rounded-xl focus:ring-2 focus:ring-hirebyte-mint/20 focus:border-hirebyte-mint outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-input rounded-xl focus:ring-2 focus:ring-hirebyte-mint/20 focus:border-hirebyte-mint outline-none transition-all"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                                    </>
                                ) : (
                                    isSignUp ? 'Create Account' : 'Sign In'
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {isSignUp
                                        ? "Already have an account? Sign In"
                                        : "Don't have an account? Sign Up"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
