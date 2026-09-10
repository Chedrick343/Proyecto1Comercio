import styles from './NavBar.module.css';

import search from '../../assets/searchhimg1.png';
import house from '../../assets/houseimg1.png';
import cart from '../../assets/shoppingkartimg1.png';
import profile from '../../assets/profileimg1.png';
import { useState } from 'react';
type NavOption = 'home' | 'search' | 'account' | 'cart';

export default function NavBar() {

    const [selected, setSelected] = useState<NavOption>('home');

    return (
        <nav className={styles.navBar}>

            {/* Círculo que se mueve */}
            <div
                className={`${styles.indicator} ${styles[selected]}`}
            ></div>


            {/* SEARCH */}
            <button
                className={`${styles.navItem} ${
                    selected === 'search' ? styles.active : ''
                }`}
                onClick={() => setSelected('search')}
            >
                <img src={search} alt="Search" />
                {selected === 'search' && <span>Search</span>}
            </button>


            {/* HOME */}
            <button
                className={`${styles.navItem} ${
                    selected === 'home' ? styles.active : ''
                }`}
                onClick={() => setSelected('home')}
            >
                <img src={house} alt="Home" />
                {selected === 'home' && <span>Home</span>}
            </button>


            {/* SHOPPING CART */}
            <button
                className={`${styles.navItem} ${
                    selected === 'cart' ? styles.active : ''
                }`}
                onClick={() => setSelected('cart')}
            >
                <img src={cart} alt="Shopping Cart" />
                {selected === 'cart' && <span>Cart</span>}
            </button>


            {/* ACCOUNT */}
            <button
                className={`${styles.navItem} ${
                    selected === 'account' ? styles.active : ''
                }`}
                onClick={() => setSelected('account')}
            >
                <img src={profile} alt="Account" />
                {selected === 'account' && <span>Account</span>}
            </button>

        </nav>
    );
}