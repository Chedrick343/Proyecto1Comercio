import styles from './Logo.module.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Logo() {
    const { t } = useTranslation();
    const brand = t('brand');

    return (
        <Link to="/" className={styles.logoContainer} aria-label={t('header.homeLink', { brand })}>
            <h1 className={styles.logo}>{brand}</h1>
        </Link>
    );
}