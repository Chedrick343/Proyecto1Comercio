/**
 * @fileoverview Logotipo de la tienda: símbolo y nombre de la marca.
 */

import styles from './Logo.module.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoMark from './LogoMark';

/**
 * Muestra el símbolo y el nombre de la marca como enlace al inicio.
 *
 * @return El logotipo enlazado al catálogo.
 */
export default function Logo() {
    const { t } = useTranslation();
    const brand = t('brand');

    return (
        <Link to="/" className={styles.logoContainer} aria-label={t('header.homeLink', { brand })}>
            <LogoMark className={styles.mark} />
            <h1 className={styles.logo}>{brand}</h1>
        </Link>
    );
}