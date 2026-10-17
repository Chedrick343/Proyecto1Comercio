import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('account');

    return (
        <main className="app">
            <div className="top-bar">
                <Header />
            </div>

            <section className={styles.accountPage}>
                <header className={styles.pageHeader}>
                    <p className={styles.eyebrow}>{t('eyebrow')}</p>
                    <h1>{t('title')}</h1>
                </header>

                <div className={`${styles.accountLayout} ${LAYOUT_CLASS_BY_VIEW[view]}`}>
                    <aside className={styles.sidebar}>
                        <UserSection activeItemId="orders" />
                    </aside>

                    <div className={styles.content}>
                        <Link to="/cuenta" className={styles.backLink}>
                            ← {t('backToAccount')}
                        </Link>
                        <Orders />
                    </div>
                </div>
            </section>

            <NavBar />
        </main>
    );
}
