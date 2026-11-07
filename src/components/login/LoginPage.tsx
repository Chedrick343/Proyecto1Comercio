/**
 * @fileoverview Página de inicio de sesión.
 */

import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft } from 'react-icons/fa';

import { useSession } from '../../context/SessionContext';
import LogoMark from '../logo/LogoMark';
import LoginForm from './LoginForm';
import LoginShowcase from './LoginShowcase';

import styles from './LoginPage.module.css';

/**
 * Muestra el formulario de inicio de sesión junto al panel de la marca. Si ya
 * hay una sesión iniciada, redirige a la cuenta.
 *
 * @return La página de inicio de sesión o una redirección.
 */
export default function LoginPage() {
    const { t } = useTranslation(['auth', 'common']);
    const { currentUser } = useSession();

    if (currentUser) {
        return <Navigate to="/cuenta" replace />;
    }

    return (
        <main className={styles.loginPage}>
            <section className={styles.formColumn}>
                <nav className={styles.topBar}>
                    <Link to="/" className={styles.brand}>
                        <LogoMark className={styles.brandMark} />
                        {t('common:brand')}
                    </Link>
                    <Link to="/" className={styles.backLink}>
                        <FaArrowLeft aria-hidden="true" />
                        {t('auth:login.backToStore')}
                    </Link>
                </nav>

                <div className={styles.formContainer}>
                    <LoginForm />
                </div>
            </section>

            <LoginShowcase />
        </main>
    );
}
