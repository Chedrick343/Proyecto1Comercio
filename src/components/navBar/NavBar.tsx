/**
 * @fileoverview Barra de navegación inferior para pantallas móviles.
 */

import styles from './NavBar.module.css';

import { FaHome, FaSearch, FaShoppingCart, FaUser } from 'react-icons/fa';
import type { IconType } from 'react-icons';

import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useCart } from '../../context/CartContext';
import { FOCUS_SEARCH_STATE } from '../search-bar/searchFocus';
import CartBadge from '../cart-badge/CartBadge';
import { isCartPreviewAvailable, useCartPreview } from '../cart-preview/cartPreviewContext';

/** Opción de la barra de navegación. */
type NavOption = 'home' | 'search' | 'account' | 'cart';

/** Opción de la barra con su ícono y destino. */
interface NavItem {
    id: NavOption;
    Icon: IconType;
    path: string;
    /** Estado de navegación que se envía al destino. */
    state?: unknown;
    /** Muestra la opción sin permitir seleccionarla. */
    disabled?: boolean;
}

/** Opciones de la barra, en el orden en que se muestran. */
const NAV_ITEMS: NavItem[] = [
    { id: 'search', Icon: FaSearch, path: '/', state: FOCUS_SEARCH_STATE },
    { id: 'account', Icon: FaUser, path: '/cuenta' },
    { id: 'cart', Icon: FaShoppingCart, path: '/carrito' },
    { id: 'home', Icon: FaHome, path: '/', disabled: true }
];

/** Opción que se marca como activa según el inicio de la ruta. */
const SELECTED_OPTION_BY_PATH_PREFIX: [string, NavOption][] = [
    ['/producto', 'search'],
    ['/carrito', 'cart'],
    ['/checkout', 'cart'],
    ['/cuenta', 'account'],
    ['/orden', 'account']
];

/**
 * Determina qué opción de la barra corresponde a la ruta actual.
 *
 * @param pathname Ruta actual.
 * @return La opción activa, o null si ninguna corresponde.
 */
function getSelectedOption(pathname: string): NavOption | null {
    if (pathname === '/') {
        return 'search';
    }

    const match = SELECTED_OPTION_BY_PATH_PREFIX.find(([prefix]) =>
        pathname.startsWith(prefix)
    );

    return match ? match[1] : null;
}

/**
 * Muestra la barra de navegación inferior. La opción del carrito abre la
 * vista previa cuando está disponible.
 *
 * @return La barra de navegación.
 */
export default function NavBar() {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const { totalItems } = useCart();
    const cartPreview = useCartPreview();

    const selected = getSelectedOption(pathname);

    return (
        <nav className={styles.navBar} aria-label={t('nav.label')}>
            {NAV_ITEMS.map(({ id, Icon, path, state, disabled }) => {
                const opensCartPreview = id === 'cart' && isCartPreviewAvailable(pathname);
                const isSelected = selected === id || (opensCartPreview && cartPreview.isOpen);
                const label = t(`nav.${id}`);

                const content = (
                    <>
                        <Icon className={styles.navIcon} size={28} aria-hidden="true" />

                        {id === 'cart' && (
                            <CartBadge
                                count={totalItems}
                                inverted={isSelected}
                                className={styles.cartBadge}
                            />
                        )}

                        <span className={styles.srOnly}>{label}</span>
                    </>
                );

                if (disabled) {
                    return (
                        <span
                            key={id}
                            className={`${styles.navItem} ${styles.disabled}`}
                            aria-disabled="true"
                            role="link"
                        >
                            {content}
                        </span>
                    );
                }

                if (opensCartPreview) {
                    return (
                        <button
                            key={id}
                            type="button"
                            className={`${styles.navItem} ${isSelected ? styles.active : ''}`}
                            aria-haspopup="dialog"
                            aria-expanded={cartPreview.isOpen}
                            onClick={cartPreview.open}
                        >
                            {content}
                        </button>
                    );
                }

                return (
                    <Link
                        key={id}
                        to={path}
                        state={state}
                        className={`${styles.navItem} ${isSelected ? styles.active : ''}`}
                        aria-current={isSelected ? 'page' : undefined}
                    >
                        {content}
                    </Link>
                );
            })}
        </nav>
    );
}
