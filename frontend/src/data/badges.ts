export type BadgeCategory = 'communication' | 'body_language' | 'answer_quality' | 'time_flow' | 'progress' | 'achievement';

export interface BadgeDefinition {
    id: string;
    name: string;
    category: BadgeCategory;
    /** Hex color used for the dot and tinting */
    color: string;
}

export const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
    communication: '🎙️ Communication',
    body_language: '👀 Body Language & Presence',
    answer_quality: '🧠 Answer Quality',
    time_flow: '⏱️ Time & Flow',
    progress: '📈 Progress & Improvement',
    achievement: '🏆 Special Achievements',
};

export const BADGES: Record<string, BadgeDefinition> = {
    // ── Communication ──
    clear_communicator: { id: 'clear_communicator', name: 'Clear Communicator', category: 'communication', color: '#ef4444' },
    filler_free: { id: 'filler_free', name: 'Filler-Free Speaker', category: 'communication', color: '#f97316' },
    concise_answerer: { id: 'concise_answerer', name: 'Concise Answerer', category: 'communication', color: '#22c55e' },
    fluent_speaker: { id: 'fluent_speaker', name: 'Fluent Speaker', category: 'communication', color: '#06b6d4' },

    // ── Body Language & Presence ──
    eye_contact_pro: { id: 'eye_contact_pro', name: 'Eye Contact Pro', category: 'body_language', color: '#f59e0b' },
    confident_posture: { id: 'confident_posture', name: 'Confident Posture', category: 'body_language', color: '#6366f1' },
    calm_under_pressure: { id: 'calm_under_pressure', name: 'Calm Under Pressure', category: 'body_language', color: '#14b8a6' },
    positive_expression: { id: 'positive_expression', name: 'Positive Expression', category: 'body_language', color: '#10b981' },
    steady_presence: { id: 'steady_presence', name: 'Steady Presence', category: 'body_language', color: '#a855f7' },

    // ── Answer Quality ──
    star_method_master: { id: 'star_method_master', name: 'STAR Method Master', category: 'answer_quality', color: '#3b82f6' },
    role_relevant_thinker: { id: 'role_relevant_thinker', name: 'Role-Relevant Thinker', category: 'answer_quality', color: '#84cc16' },
    problem_solver: { id: 'problem_solver', name: 'Problem Solver', category: 'answer_quality', color: '#6366f1' },
    example_driven: { id: 'example_driven', name: 'Example Driven', category: 'answer_quality', color: '#10b981' },
    depth_achiever: { id: 'depth_achiever', name: 'Depth Achiever', category: 'answer_quality', color: '#8b5cf6' },

    // ── Time & Flow ──
    well_paced_speaker: { id: 'well_paced_speaker', name: 'Well-Paced Speaker', category: 'time_flow', color: '#22c55e' },
    quick_thinker: { id: 'quick_thinker', name: 'Quick Thinker', category: 'time_flow', color: '#0ea5e9' },
    smooth_transitions: { id: 'smooth_transitions', name: 'Smooth Transitions', category: 'time_flow', color: '#d946ef' },

    // ── Progress & Improvement ──
    confidence_builder: { id: 'confidence_builder', name: 'Confidence Builder', category: 'progress', color: '#3b82f6' },
    rapid_improver: { id: 'rapid_improver', name: 'Rapid Improver', category: 'progress', color: '#f97316' },
    consistency_champ: { id: 'consistency_champ', name: 'Consistency Champ', category: 'progress', color: '#22c55e' },
    practice_streak: { id: 'practice_streak', name: 'Practice Streak', category: 'progress', color: '#a855f7' },
    comeback_performer: { id: 'comeback_performer', name: 'Comeback Performer', category: 'progress', color: '#ec4899' },

    // ── Special Achievements ──
    interview_ready: { id: 'interview_ready', name: 'Interview Ready', category: 'achievement', color: '#eab308' },
    top_10_percent: { id: 'top_10_percent', name: 'Top 10% Performer', category: 'achievement', color: '#a855f7' },
    mock_interview_ace: { id: 'mock_interview_ace', name: 'Mock Interview Ace', category: 'achievement', color: '#6366f1' },
    stress_slayer: { id: 'stress_slayer', name: 'Stress Slayer', category: 'achievement', color: '#ef4444' },
    first_attempt_star: { id: 'first_attempt_star', name: 'First Attempt Star', category: 'achievement', color: '#f59e0b' },
};
