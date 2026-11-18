/**
 * @fileoverview Contenido del panel administrativo dentro de la cuenta,
 * disponible solo para quien puede ver información administrativa. Se
 * organiza en secciones con pestañas; la sección abierta queda en la URL.
 */

import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import RequirePermission from '../access/RequirePermission';
import AdminOrdersList from './AdminOrdersList';
import AdminProductsList from './AdminProductsList';
import {
    ADMIN_PATH,
    ADMIN_SECTION_PARAM,
    ADMIN_SECTION_SLUGS,
    getAdminSectionFromSlug,
    type AdminSection
} from './adminRoutes';
import UsageDashboard from './UsageDashboard';

import styles from './AdminPanel.module.css';

/**
 * Muestra las pestañas de las secciones del panel.
 *
 * @param props Propiedades del componente.
 * @param props.activeSection Sección abierta.
 * @return La barra de pestañas.
 */
function AdminSectionTabs({ activeSection }: { activeSection: AdminSection }) {
    const { t } = useTranslation('admin');
    const sections = Object.keys(ADMIN_SECTION_SLUGS) as AdminSection[];

    return (
        <nav className={styles.tabs} aria-label={t('sections.label')}>
            {sections.map((section) => {
                const isActive = section === activeSection;

                return (
                    <Link
                        key={section}
                        to={`${ADMIN_PATH}?${ADMIN_SECTION_PARAM}=${ADMIN_SECTION_SLUGS[section]}`}
                        className={isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {t(`sections.${section}`)}
                    </Link>
                );
            })}
        </nav>
    );
}

/**
 * Muestra el contenido de una sección del panel.
 *
 * @param props Propiedades del componente.
 * @param props.section Sección a mostrar.
 * @return El contenido de la sección.
 */
function AdminSectionContent({ section }: { section: AdminSection }) {
    if (section === 'products') {
        return <AdminProductsList />;
    }

    if (section === 'usage') {
        return <UsageDashboard />;
    }

    return <AdminOrdersList />;
}

/**
 * Muestra las secciones del panel al administrador: órdenes, productos con su
 * inventario por sucursal y métricas de uso. A cualquier otra persona le
 * muestra un mensaje de acceso denegado.
 *
 * @return El panel o el mensaje de acceso denegado.
 */
export default function AdminPanel() {
    const [searchParams] = useSearchParams();
    const activeSection = getAdminSectionFromSlug(searchParams.get(ADMIN_SECTION_PARAM));

    return (
        <RequirePermission permission="VIEW_ADMIN_INFORMATION">
            <div className={styles.panel}>
                <AdminSectionTabs activeSection={activeSection} />
                <AdminSectionContent section={activeSection} />
            </div>
        </RequirePermission>
    );
}
