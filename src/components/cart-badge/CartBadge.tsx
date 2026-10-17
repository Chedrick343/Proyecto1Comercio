import styles from './CartBadge.module.css';

const MAX_DISPLAYED_COUNT = 99;

interface CartBadgeProps {
    count: number;
    inverted?: boolean;
    className?: string;
}

export default function CartBadge({ count, inverted = false, className }: CartBadgeProps) {
    if (count <= 0) {
        return null;
    }

    const classNames = [styles.badge, inverted && styles.inverted, className]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classNames} aria-hidden="true">
            {count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : count}
        </span>
    );
}
