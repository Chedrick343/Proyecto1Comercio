import styles from './NavBar.module.css';

import { FaSearch } from 'react-icons/fa';
import { FaHome } from 'react-icons/fa';
import { FaShoppingCart } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa';

import type { IconType } from 'react-icons';

import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useCart } from '../../context/CartContext';
import { FOCUS_SEARCH_STATE } from '../search-bar/searchFocus';

type NavOption = 'home' | 'search' | 'account' | 'cart';

const navOptions: {
    id: NavOption;
    Icon: IconType;
    path: string;
    state?: unknown;
}[] = [
    {
        id: 'search',
        Icon: FaSearch,
        path: '/',
        state: FOCUS_SEARCH_STATE
    },
    {
        id: 'home',
        Icon: FaHome,
        path: '/'
    },
    {
        id: 'cart',
        Icon: FaShoppingCart,
        path: '/carrito'
    },
    {
        id: 'account',
        Icon: FaUser,
        path: '/cuenta'
    }
];

export default function NavBar() {

    const { t } = useTranslation();
    const location = useLocation();

    const { totalItems } = useCart();

    const getSelectedOption = (): NavOption => {

        if (location.pathname === '/') {
            return 'home';
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
            aria-label={t('nav.label')}
        >

            {navOptions.map(
                ({ id, Icon, path, state }) => (
                    <Link
                        key={id}
                        to={path}
                        state={state}
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
                        aria-label={t(`nav.${id}`)}
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
                            {t(`nav.${id}`)}
                        </span>
                    </Link>
                )
            )}

        </nav>
    );
}