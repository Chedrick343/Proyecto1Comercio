/**
 * @fileoverview Captura los errores inesperados de renderizado de toda la aplicación.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

import i18n from '../../i18n';
import ErrorState from './ErrorState';

import styles from './ErrorState.module.css';

/** Propiedades de AppErrorBoundary. */
interface AppErrorBoundaryProps {
    children: ReactNode;
}

/** Estado de AppErrorBoundary. */
interface AppErrorBoundaryState {
    hasError: boolean;
}

/**
 * Muestra una página de error cuando un componente falla al renderizar.
 * Los límites de error deben ser componentes de clase; React no tiene un
 * hook equivalente.
 */
export default class AppErrorBoundary extends Component<
    AppErrorBoundaryProps,
    AppErrorBoundaryState
> {
    state: AppErrorBoundaryState = { hasError: false };

    /**
     * Activa la página de error cuando un componente hijo lanza un error.
     *
     * @return El estado con el error activo.
     */
    static getDerivedStateFromError(): AppErrorBoundaryState {
        return { hasError: true };
    }

    /**
     * Registra el error en la consola.
     *
     * @param error Error lanzado.
     * @param errorInfo Información de React sobre dónde ocurrió.
     * @override
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error inesperado en la aplicación:', error, errorInfo.componentStack);
    }

    /** Quita la página de error para volver a intentar el renderizado. */
    handleRetry = () => {
        this.setState({ hasError: false });
    };

    /**
     * Renderiza los hijos o, si hubo un error, la página de error. Esta se
     * muestra fuera del enrutador, así que usa un enlace normal que recarga la
     * aplicación.
     *
     * @return Los hijos o la página de error.
     * @override
     */
    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

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
