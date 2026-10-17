import { Link } from 'react-router-dom';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import Orders from '../Orders/Orders';
import UserSection from './userSection';

import styles from './AccountPage.module.css';

export type AccountView = 'menu' | 'orders';

const LAYOUT_CLASS_BY_VIEW: Record<AccountView, string> = {
    menu: styles.showingMenu,
    orders: styles.showingOrders
};

interface AccountPageProps {
    view: AccountView;
}

export default function AccountPage({ view }: AccountPageProps) {
    return (
        <main className="app">
            <div className="top-bar">
                <Header />
            </div>

            <section className={styles.accountPage}>
                <header className={styles.pageHeader}>
                    <p className={styles.eyebrow}>TU CUENTA</p>
                    <h1>Mi cuenta</h1>
                </header>

                <div className={`${styles.accountLayout} ${LAYOUT_CLASS_BY_VIEW[view]}`}>
                    <aside className={styles.sidebar}>
                        <UserSection activeItemId="orders" />
                    </aside>

                    <div className={styles.content}>
                        <Link to="/cuenta" className={styles.backLink}>
                            ← Volver a mi cuenta
                        </Link>
                        <Orders />
                    </div>
                </div>
            </section>

            <NavBar />
        </main>
    );
}
