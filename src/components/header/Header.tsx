import type { ReactNode } from 'react';
import Logo from '../logo/logo';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

import styles from './Header.module.css';

function CartButton() {
    const { totalItems } = useCart();

    return (
        <Link
            to="/carrito"
            className={styles.headerButton}
            aria-label={`Carrito${totalItems > 0 ? `, ${totalItems} productos` : ''}`}
        >
            <FaShoppingCart
                className={styles.headerIcon}
                aria-hidden="true"
            />

            <span className={styles.headerLabel}>
                Carrito
            </span>

            {totalItems > 0 && (
                <span className={styles.cartBadge} aria-hidden="true">
                    {totalItems}
                </span>
            )}
        </Link>
    );
}

function AccountButton() {
    return (
        <Link
            to="/cuenta"
            className={`${styles.headerButton} ${styles.accountButton}`}
            aria-label="Cuenta"
        >
            <FaUser
                className={styles.headerIcon}
                aria-hidden="true"
            />

            <span className={styles.headerLabel}>
                Cuenta
            </span>
        </Link>
    );
}

interface HeaderProps {
    children?: ReactNode;
}

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
