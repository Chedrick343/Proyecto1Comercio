import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { FaExclamationTriangle } from 'react-icons/fa';

import styles from './ErrorState.module.css';

interface ErrorStateProps {
    title: string;
    description: string;
    icon?: IconType;
    actions?: ReactNode;
}

export default function ErrorState({
    title,
    description,
    icon: Icon = FaExclamationTriangle,
    actions
}: ErrorStateProps) {
    return (
        <div className={styles.errorState} role="alert">
            <span className={styles.iconCircle}>
                <Icon aria-hidden="true" />
            </span>

            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>

            {actions && <div className={styles.actions}>{actions}</div>}
        </div>
    );
}
