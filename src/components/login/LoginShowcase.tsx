/**
 * @fileoverview Panel de presentación del login con el logotipo de la marca.
 */

import { useTranslation } from 'react-i18next';

import LogoMark from '../logo/LogoMark';

import styles from './LoginShowcase.module.css';

/**
 * Muestra el símbolo de la marca en un medallón, con el nombre y el lema de la
 * tienda. Solo aparece en pantallas anchas.
 *
 * @return El panel de presentación.
 */
export default function LoginShowcase() {
    const { t } = useTranslation(['auth', 'common']);

    return (
        <aside className={styles.showcase}>
            <div className={styles.medallion}>
                <LogoMark className={styles.mark} />
            </div>

            <p className={styles.brand}>{t('common:brand')}</p>
            <span className={styles.divider} aria-hidden="true" />
            <p className={styles.tagline}>{t('auth:showcase.tagline')}</p>
        </aside>
    );
}
