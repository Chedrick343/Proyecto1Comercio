import Logo from '../logo/logo';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

import styles from './Header.module.css';

interface CartButtonProps {
    inSearchTools?: boolean;
}

export function CartButton({ inSearchTools = false }: CartButtonProps) {
    const { totalItems } = useCart();

    return (
        <Link
            to="/carrito"
            className={`${styles.headerButton} ${styles.cartButton} ${
                inSearchTools ? styles.searchCartButton : ''
            }`}
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

export function AccountButton() {
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

export default function Header() {
    return (
        <header className={styles.header}>
            <Logo />

            <div className={styles.headerActions}>
                <AccountButton />
                <CartButton />
            </div>
        </header>
    );
}