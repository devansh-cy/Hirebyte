import { X, Calendar, Briefcase, TrendingUp } from 'lucide-react';
import { MockInterview } from '../lib/supabase';

interface RecentActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviews: MockInterview[];
}

export function RecentActivityModal({ isOpen, onClose, interviews }: RecentActivityModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto border-l border-slate-800">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100">Recent Activity</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {interviews.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">No mock interviews yet</p>
              <p className="text-sm text-slate-500 mt-2">
                Start your first interview to see it here
              </p>
            </div>
          ) : (
            interviews.map((interview) => (
              <div
                key={interview.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                      {interview.role_title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(interview.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-slate-400" />
                      <span className={`text-2xl font-bold ${getScoreColor(interview.performance_score)}`}>
                        {interview.performance_score}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1">Score</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        interview.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400'
                          : interview.status === 'in_progress'
                          ? 'bg-blue-950 text-blue-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {interview.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
