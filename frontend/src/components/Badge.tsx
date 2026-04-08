import { BADGES } from '../data/badges';

interface BadgeProps {
    id: string;
}

/**
 * Renders a compact pill badge: colored dot + name.
 * Supports light and dark mode via inline styles with CSS variables.
 */
export function Badge({ id }: BadgeProps) {
    const badge = BADGES[id];
    if (!badge) return null;

    const { name, color } = badge;

    return (
        <span
            className="badge-pill"
            style={{
                '--badge-color': color,
            } as React.CSSProperties}
        >
            <span className="badge-dot" />
            <span className="badge-label">{name}</span>
        </span>
    );
}
