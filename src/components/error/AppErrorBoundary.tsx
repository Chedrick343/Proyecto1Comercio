import { Component, type ErrorInfo, type ReactNode } from 'react';

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
                    title="Algo salió mal"
                    description="Ocurrió un problema inesperado. Tu carrito y tus pedidos siguen guardados."
                    actions={
                        <>
                            <button
                                type="button"
                                className={styles.secondaryAction}
                                onClick={this.handleRetry}
                            >
                                Reintentar
                            </button>
                            <a href={import.meta.env.BASE_URL} className={styles.primaryAction}>
                                Ir al inicio
                            </a>
                        </>
                    }
                />
            </main>
        );
    }
}
