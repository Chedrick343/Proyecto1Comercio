import Logo from '../logo/logo';
import { Link } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

import styles from './Header.module.css';

interface HeaderProps {
    showCart?: boolean;
}

interface CartButtonProps {
    inSearchTools?: boolean;
}

export function CartButton({ inSearchTools = false }: CartButtonProps) {
    const { totalItems } = useCart();

    return (
        <Link
            to="/carrito"
            className={`${styles.cartButton} ${inSearchTools ? styles.searchCartButton : ''}`}
            aria-label={`Carrito${totalItems > 0 ? `, ${totalItems} productos` : ''}`}
        >
            <FaShoppingCart className={styles.cartIcon} aria-hidden="true" />
            <span className={styles.cartLabel}>Carrito</span>
            {totalItems > 0 && (
                <span className={styles.cartBadge} aria-hidden="true">
                    {totalItems}
                </span>
            )}
        </Link>
    );
}

export default function Header({ showCart = true }: HeaderProps) {
    return (
        <header className={styles.header}>
            <Logo />
            {showCart && <CartButton />}
        </header>
    );
}