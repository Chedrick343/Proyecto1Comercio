import { Link } from 'react-router-dom';
import { FaCompass } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import ErrorState from './ErrorState';

import styles from './ErrorState.module.css';

export default function NotFoundPage() {
    const { t } = useTranslation('errors');

    return (
        <main className="app">
            <div className="top-bar">
                <Header />
            </div>

            <ErrorState
                icon={FaCompass}
                title={t('notFound.title')}
                description={t('notFound.description')}
                actions={
                    <Link to="/" className={styles.primaryAction}>
                        {t('notFound.goToCatalog')}
                    </Link>
                }
            />

            <NavBar />
        </main>
    );
}
