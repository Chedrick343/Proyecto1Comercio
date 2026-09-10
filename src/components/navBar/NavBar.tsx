import styles from './NavBar.module.css';

import { FaSearch } from 'react-icons/fa';
import { FaHome } from 'react-icons/fa';
import { FaShoppingCart } from 'react-icons/fa';
import { FaUser } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { useState } from 'react';

type NavOption = 'home' | 'search' | 'account' | 'cart';

const navOptions: { id: NavOption; Icon: IconType; label: string }[] = [
    { id: 'search', Icon: FaSearch, label: 'Buscar' },
    { id: 'home', Icon: FaHome, label: 'Inicio' },
    { id: 'cart', Icon: FaShoppingCart, label: 'Carrito' },
    { id: 'account', Icon: FaUser, label: 'Cuenta' }
];

export default function NavBar() {

    const [selected, setSelected] = useState<NavOption>('home');

    return (
        <nav className={styles.navBar} aria-label="Navegación principal">

            {navOptions.map(({ id, Icon, label }) => (
                <button
                    key={id}
                    type="button"
                    className={`${styles.navItem} ${
                        selected === id ? styles.active : ''
                    }`}
                    onClick={() => setSelected(id)}
                    aria-current={selected === id ? 'page' : undefined}
                >
                    <Icon className={styles.navIcon} size={28} aria-hidden="true" />
                    <span className={styles.srOnly}>{label}</span>
                </button>
            ))}


        </nav>
    );
}
