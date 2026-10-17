import { Component, type ErrorInfo, type ReactNode } from 'react';

import i18n from '../../i18n';
import ErrorState from './ErrorState';

import styles from './ErrorState.module.css';

interface AppErrorBoundaryProps {
    children: ReactNode;
}

interface AppErrorBoundaryState {
    hasError: boolean;
}

// Error boundaries must be class components; React has no hook equivalent.
export default class AppErrorBoundary extends Component<
    AppErrorBoundaryProps,
    AppErrorBoundaryState
> {
    state: AppErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): AppErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error inesperado en la aplicación:', error, errorInfo.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        // Rendered outside the router, so it uses a plain link that reloads the app.
        return (
            <main className={styles.fullPage}>
                <ErrorState
                    title={i18n.t('errors:unexpected.title')}
                    description={i18n.t('errors:unexpected.description')}
                    actions={
                        <>
                            <button
                                type="button"
                                className={styles.secondaryAction}
                                onClick={this.handleRetry}
                            >
                                {i18n.t('common:actions.retry')}
                            </button>
                            <a href={import.meta.env.BASE_URL} className={styles.primaryAction}>
                                {i18n.t('errors:unexpected.goHome')}
                            </a>
                        </>
                    }
                />
            </main>
        );
    }
}
