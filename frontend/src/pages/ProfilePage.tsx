import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Briefcase, Calendar, TrendingUp, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ProfilePage() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [interviews, setInterviews] = useState<any[]>([]);

    useEffect(() => {
        getProfile();
    }, []);

    async function getProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/auth');
                return;
            }

            // Get profile data
            let { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profileData && !profileError) {
                // Create profile if not exists
                const { data: newProfile } = await supabase
                    .from('profiles')
                    .insert([{ id: user.id, full_name: user.user_metadata.full_name, avatar_url: user.user_metadata.avatar_url }])
                    .select()
                    .single();

                profileData = newProfile;
            }

            setProfile(profileData || { full_name: user.email?.split('@')[0] }); // Fallback

            // Get interviews (Mock data for now if table doesn't exist)
            const { data: interviewData } = await supabase
                .from('interviews')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (interviewData) setInterviews(interviewData);

        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#0b0b0b] text-white">Loading...</div>;
    }

    // Calculate stats
    const totalInterviews = interviews.length;
    const avgScore = interviews.length > 0
        ? Math.round(interviews.reduce((acc, curr) => acc + (curr.performance_score || 0), 0) / interviews.length)
        : 0;

    return (
        <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-[#0b0b0b] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>

            {/* Navbar area */}
            <nav className="border-b border-white/5 p-4 flex justify-between items-center bg-[#161616]">
                <h1 className="text-xl font-bold text-white cursor-pointer" onClick={() => navigate('/')}>HireByte</h1>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </nav>

            <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-1">
                            <div className="w-full h-full rounded-full bg-[#1e1e24] flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">{profile?.full_name || 'User'}</h1>
                            <p className="text-gray-400">Software Engineer</p>
                            {/* Placeholder role, could be editable */}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/setup')}
                        className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/5"
                    >
                        <Plus className="w-5 h-5" /> Start New Interview
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-gray-400">
                            <Briefcase className="w-5 h-5" />
                            <span className="text-sm font-medium">Total Interviews</span>
                        </div>
                        <p className="text-4xl font-bold text-white">{totalInterviews}</p>
                    </div>
                    <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-gray-400">
                            <TrendingUp className="w-5 h-5" />
                            <span className="text-sm font-medium">Average Score</span>
                        </div>
                        <p className={`text-4xl font-bold ${avgScore >= 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>{avgScore}</p>
                    </div>
                    {/* Github/Leetcode style contribution graph placeholder */}
                    <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4 text-gray-400">
                            <Calendar className="w-5 h-5" />
                            <span className="text-sm font-medium">Activity</span>
                        </div>
                        <div className="flex gap-1 h-12 items-end">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/50 rounded-sm transition-colors" style={{ height: `${Math.random() * 100}%` }}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-[#161616] border border-white/5 rounded-3xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-bold text-white">Interview History</h2>
                    </div>

                    <div className="p-6">
                        {interviews.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>No interviews yet. Start your first one!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {interviews.map((interview) => (
                                    <div key={interview.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
                                        <div className="mb-2 md:mb-0">
                                            <h3 className="font-bold text-white">{interview.role_title || 'Mock Interview'}</h3>
                                            <p className="text-sm text-gray-400">{formatDate(interview.created_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-400">Score</p>
                                                <p className="font-bold text-indigo-400">{interview.performance_score || 0}</p>
                                            </div>
                                            <button
                                                className="px-4 py-2 bg-indigo-600/20 text-indigo-300 rounded-lg text-sm hover:bg-indigo-600/30 transition-colors"
                                                onClick={() => navigate(`/report/${interview.id}`)} // Needs implementation
                                            >
                                                View Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
