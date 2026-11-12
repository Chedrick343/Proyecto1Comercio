/**
 * @fileoverview Página de la cuenta del cliente.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import Orders from '../Orders/Orders';
import AdminPanel from '../admin/AdminPanel';
import RequirePermission from '../access/RequirePermission';
import UserSection from './userSection';

import styles from './AccountPage.module.css';

/**
 * Vista de la cuenta. En pantallas pequeñas se muestra solo el menú o solo
 * el contenido elegido; en pantallas grandes, ambos.
 */
export type AccountView = 'menu' | 'orders' | 'admin';

/** Clase de diseño de cada vista. */
const LAYOUT_CLASS_BY_VIEW: Record<AccountView, string> = {
    menu: styles.showingMenu,
    orders: styles.showingContent,
    admin: styles.showingContent
};

/** Propiedades de AccountPage. */
interface AccountPageProps {
    view: AccountView;
}

/**
 * Muestra el menú de la cuenta junto al historial de órdenes o, en la vista
 * del administrador, junto al panel administrativo. Todas las vistas usan el
 * mismo diseño, así que el menú no se mueve al cambiar entre ellas.
 *
 * @param props Propiedades del componente.
 * @return La página de la cuenta.
 */
export default function AccountPage({ view }: AccountPageProps) {
    const { t } = useTranslation('account');
    const isAdminView = view === 'admin';

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
                        <UserSection activeItemId={isAdminView ? 'admin' : 'orders'} />
                    </aside>

                    <div className={styles.content}>
                        <Link to="/cuenta" className={styles.backLink}>
                            ← {t('backToAccount')}
                        </Link>
                        {isAdminView ? (
                            <AdminPanel />
                        ) : (
                            <RequirePermission permission="VIEW_OWN_ORDERS">
                                <Orders />
                            </RequirePermission>
                        )}
                    </div>
                </div>
            </section>

            <NavBar />
        </main>
    );
}
