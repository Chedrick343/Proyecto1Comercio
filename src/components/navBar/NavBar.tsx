import styles from './NavBar.module.css';

import { FaSearch } from 'react-icons/fa';
import { FaHome } from 'react-icons/fa';
import { FaShoppingCart } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa';

import type { IconType } from 'react-icons';

import { Link, useLocation } from 'react-router-dom';

import { useCart } from '../../context/CartContext';

type NavOption = 'home' | 'search' | 'account' | 'cart';

const navOptions: {
    id: NavOption;
    Icon: IconType;
    label: string;
    path: string;
}[] = [
    {
        id: 'search',
        Icon: FaSearch,
        label: 'Buscar',
        path: '/buscar'
    },
    {
        id: 'home',
        Icon: FaHome,
        label: 'Inicio',
        path: '/'
    },
    {
        id: 'cart',
        Icon: FaShoppingCart,
        label: 'Carrito',
        path: '/carrito'
    },
    {
        id: 'account',
        Icon: FaUser,
        label: 'Cuenta',
        path: '/cuenta'
    }
];

export default function NavBar() {

    const location = useLocation();

    const { totalItems } = useCart();

    const getSelectedOption = (): NavOption => {

        if (location.pathname === '/') {
            return 'home';
        }

        if (location.pathname.startsWith('/buscar')) {
            return 'search';
        }

        if (location.pathname.startsWith('/carrito')) {
            return 'cart';
        }

        if (location.pathname.startsWith('/cuenta')) {
            return 'account';
        }

        return 'home';
    };

    const selected = getSelectedOption();

    return (
        <nav
            className={styles.navBar}
            aria-label="Navegación principal"
        >

            {navOptions.map(
                ({ id, Icon, label, path }) => (
                    <Link
                        key={id}
                        to={path}
                        className={`${styles.navItem} ${
                            selected === id
                                ? styles.active
                                : ''
                        }`}
                        aria-current={
                            selected === id
                                ? 'page'
                                : undefined
                        }
                        aria-label={label}
                    >
                        <Icon
                            className={styles.navIcon}
                            size={28}
                            aria-hidden="true"
                        />

                        {id === 'cart' &&
                            totalItems > 0 && (
                                <span
                                    className={styles.cartBadge}
                                >
                                    {totalItems}
                                </span>
                            )}

                        <span
                            className={styles.srOnly}
                        >
                            {label}
                        </span>
                    </Link>
                )
            )}

        </nav>
    );
}