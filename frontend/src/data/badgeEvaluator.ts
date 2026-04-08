/**
 * badgeEvaluator.ts
 * Evaluates which badges the user has earned based on analytics + weakness data.
 * All thresholds are intentionally reasonable so users earn a handful of badges per session.
 */

export interface AnswerEvaluationQuestion {
    question: string;
    answer: string;
    category: string;
    topic: string;
    accuracy: number;
    depth: number;
    clarity: number;
    average: number;
}

export interface AnalyticsInput {
    radar_chart_data: {
        technical_accuracy: number;
        communication: number;
        confidence: number;
        focus: number;
        emotional_intelligence: number;
    };
    vision_analytics: {
        overall_eye_contact_percentage: number;
        overall_steadiness_percentage: number;
        per_question_metrics: Array<{
            question_index: number;
            eye_contact_percentage: number;
            confidence: number;
        }>;
    };
    nlp_report: {
        total_filler_count: number;
        filler_rate: number;
        talk_to_listen_ratio: number;
        most_common_fillers: Array<[string, number]>;
        sentiment_trend: number[];
    };
    scoring_summary: {
        average_score: number;
        scores_over_time: number[];
    };
    answer_evaluation?: {
        total_questions: number;
        overall_accuracy?: number;
        overall_depth?: number;
        overall_clarity?: number;
        per_question?: AnswerEvaluationQuestion[];
        per_category?: Record<string, number>;
    } | null;
}

export interface WeaknessInput {
    logical_errors?: Array<{
        question_index: number;
        issue_type: string;
        feedback: string;
        severity: string;
    }>;
    hint_usage?: Record<string, string[]>;
    [key: string]: unknown;
}

/**
 * Returns an array of badge IDs the user has earned.
 */
export function evaluateEarnedBadges(
    analytics: AnalyticsInput | null,
    weakness?: WeaknessInput | null
): string[] {
    if (!analytics) return [];

    const earned: string[] = [];
    const r = analytics.radar_chart_data;
    const v = analytics.vision_analytics;
    const n = analytics.nlp_report;
    const ae = analytics.answer_evaluation;

    // ── Weighted overall score (same formula as CandidateReport) ──
    const overallScore = Math.round(
        r.communication * 0.25 +
        r.confidence * 0.25 +
        r.technical_accuracy * 0.20 +
        r.focus * 0.15 +
        r.emotional_intelligence * 0.15
    );

    // ── Communication Badges ──
    if (n.filler_rate < 3 && r.communication > 60) earned.push('clear_communicator');
    if (n.total_filler_count <= 2) earned.push('filler_free');
    if (n.talk_to_listen_ratio >= 0.8 && n.talk_to_listen_ratio <= 1.5) earned.push('concise_answerer');
    if (r.communication > 70 && n.filler_rate < 5) earned.push('fluent_speaker');

    // ── Body Language & Presence ──
    if (v.overall_eye_contact_percentage > 70) earned.push('eye_contact_pro');
    if (r.confidence > 65) earned.push('confident_posture');
    if (v.overall_steadiness_percentage > 70) earned.push('calm_under_pressure');
    if (r.emotional_intelligence > 60) earned.push('positive_expression');
    if (v.overall_steadiness_percentage > 60 && r.confidence > 55) earned.push('steady_presence');

    // ── Answer Quality ──
    if (r.technical_accuracy > 70) earned.push('star_method_master');
    if (r.technical_accuracy > 60 && r.communication > 60) earned.push('role_relevant_thinker');

    // Problem Solver: no severe logical errors
    const severeErrors = (weakness?.logical_errors || []).filter(e => e.severity === 'error');
    if (severeErrors.length === 0) earned.push('problem_solver');

    if (r.technical_accuracy > 55 && (ae?.overall_depth ?? 0) > 6) earned.push('example_driven');
    if ((ae?.overall_depth ?? 0) > 7) earned.push('depth_achiever');

    // ── Time & Flow ──
    if (n.talk_to_listen_ratio >= 0.9 && n.talk_to_listen_ratio <= 1.3) earned.push('well_paced_speaker');
    if (r.confidence > 60 && r.technical_accuracy > 65) earned.push('quick_thinker');

    // Smooth Transitions: good communication + mostly positive sentiment
    const positiveSentiments = (n.sentiment_trend || []).filter(val => val > 0).length;
    const totalSentiments = (n.sentiment_trend || []).length;
    if (r.communication > 65 && totalSentiments > 0 && positiveSentiments / totalSentiments > 0.5) {
        earned.push('smooth_transitions');
    }

    // ── Progress & Improvement ──
    if (r.confidence > 50) earned.push('confidence_builder');

    // Comeback Performer: sentiment goes from negative early to positive late
    if (totalSentiments >= 3) {
        const firstHalf = n.sentiment_trend.slice(0, Math.floor(totalSentiments / 2));
        const secondHalf = n.sentiment_trend.slice(Math.floor(totalSentiments / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        if (avgSecond > avgFirst + 0.2) earned.push('comeback_performer');
    }

    // ── Special Achievements ──
    if (overallScore > 65) earned.push('interview_ready');
    if (overallScore > 85) earned.push('top_10_percent');
    if (r.technical_accuracy > 70 && r.communication > 70 && r.confidence > 70 && r.focus > 70 && r.emotional_intelligence > 70)
        earned.push('mock_interview_ace');
    if (v.overall_steadiness_percentage > 70 && r.confidence > 65) earned.push('stress_slayer');
    if (overallScore > 70) earned.push('first_attempt_star');

    return earned;
}