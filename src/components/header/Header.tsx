/**
 * @fileoverview Encabezado de la tienda con el logotipo y los accesos a cuenta y carrito.
 */

import type { ReactNode } from 'react';
import Logo from '../logo/logo';
import { Link, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaUserCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { useSession } from '../../context/SessionContext';
import { hasPermission } from '../../session/permissions';
import { getFirstName } from '../../session/userTypes';
import CartBadge from '../cart-badge/CartBadge';
import { isCartPreviewAvailable, useCartPreview } from '../cart-preview/cartPreviewContext';
import { createLoginRedirectState, LOGIN_PATH } from '../login/loginRedirect';

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
 * Acceso a la cuenta. Con sesión iniciada muestra el nombre y el rol del
 * usuario y enlaza a su cuenta; como invitado, enlaza al inicio de sesión.
 *
 * @return El enlace a la cuenta o al inicio de sesión.
 */
function AccountButton() {
    const { t } = useTranslation(['common', 'auth']);
    const { currentUser } = useSession();
    const location = useLocation();
    const className = `${styles.headerButton} ${styles.accountButton}`;

    if (!currentUser) {
        return (
            <Link to={LOGIN_PATH} state={createLoginRedirectState(location)} className={className}>
                <FaUser className={styles.headerIcon} aria-hidden="true" />
                <span className={styles.headerLabel}>{t('auth:session.signIn')}</span>
            </Link>
        );
    }

    const accountLabel = t('auth:session.accountOf', {
        name: currentUser.name,
        role: t(`auth:roles.${currentUser.role}`),
        userType: t(`auth:userTypes.${currentUser.role}`)
    });

    return (
        <Link
            to="/cuenta"
            className={`${className} ${styles.signedIn}`}
            aria-label={accountLabel}
            title={accountLabel}
        >
            <FaUserCircle className={styles.headerIcon} aria-hidden="true" />
            <span className={`${styles.headerLabel} ${styles.accountName}`}>
                {getFirstName(currentUser)}
            </span>
            <span className={styles.roleTag} aria-hidden="true">
                {t(`auth:roleTags.${currentUser.role}`)}
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
 * Muestra el encabezado de la tienda. El botón del carrito solo aparece
 * para quien puede comprar.
 *
 * @param props Propiedades del componente.
 * @return El encabezado.
 */
export default function Header({ children }: HeaderProps) {
    const { currentUser } = useSession();
    const canUseCart = hasPermission(currentUser, 'ADD_TO_CART');

    return (
        <header className={styles.header}>
            <Logo />

            <div className={styles.headerActions}>
                <AccountButton />
                {canUseCart && <CartButton />}
            </div>

            {children && (
                <div className={styles.headerContent}>
                    {children}
                </div>
            )}
        </header>
    );
}
