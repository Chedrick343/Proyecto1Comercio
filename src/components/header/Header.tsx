/**
 * @fileoverview Encabezado de la tienda con el logotipo y los accesos a cuenta y carrito.
 */

import type { ReactNode } from 'react';
import Logo from '../logo/logo';
import { Link, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import CartBadge from '../cart-badge/CartBadge';
import { isCartPreviewAvailable, useCartPreview } from '../cart-preview/cartPreviewContext';

import styles from './Header.module.css';

/**
 * Botón del carrito. Abre la vista previa del carrito, salvo en las páginas
 * que ya lo muestran, donde es un enlace a la página del carrito.
 *
 * @return El botón o enlace del carrito con la cantidad de productos.
 */
function CartButton() {
    const { t } = useTranslation();
    const { totalItems } = useCart();
    const { pathname } = useLocation();
    const cartPreview = useCartPreview();

    const label = totalItems > 0
        ? t('header.cartWithItems', { count: totalItems })
        : t('nav.cart');

    const content = (
        <>
            <FaShoppingCart
                className={styles.headerIcon}
                aria-hidden="true"
            />

            <span className={styles.headerLabel}>
                {t('nav.cart')}
            </span>

            <CartBadge count={totalItems} className={styles.cartBadge} />
        </>
    );

    if (!isCartPreviewAvailable(pathname)) {
        return (
            <Link to="/carrito" className={styles.headerButton} aria-label={label}>
                {content}
            </Link>
        );
    }

    return (
        <button
            type="button"
            className={styles.headerButton}
            aria-label={label}
            aria-haspopup="dialog"
            aria-expanded={cartPreview.isOpen}
            onClick={cartPreview.open}
        >
            {content}
        </button>
    );
}

/**
 * Enlace a la página de la cuenta.
 *
 * @return El enlace a la cuenta.
 */
function AccountButton() {
    const { t } = useTranslation();

    return (
        <Link
            to="/cuenta"
            className={`${styles.headerButton} ${styles.accountButton}`}
            aria-label={t('nav.account')}
        >
            <FaUser
                className={styles.headerIcon}
                aria-hidden="true"
            />

            <span className={styles.headerLabel}>
                {t('nav.account')}
            </span>
        </Link>
    );
}

/** Propiedades de Header. */
interface HeaderProps {
    /** Contenido adicional bajo el logotipo, como la barra de búsqueda. */
    children?: ReactNode;
}

/**
 * Muestra el encabezado de la tienda.
 *
 * @param props Propiedades del componente.
 * @return El encabezado.
 */
export default function Header({ children }: HeaderProps) {
    return (
        <header className={styles.header}>
            <Logo />

            <div className={styles.headerActions}>
                <AccountButton />
                <CartButton />
            </div>

            {children && (
                <div className={styles.headerContent}>
                    {children}
                </div>
            )}
        </header>
    );
}
