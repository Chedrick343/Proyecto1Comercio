/**
 * @fileoverview Perfil y menú de la cuenta del cliente.
 */

import { Link } from 'react-router-dom';
import {
    FaCog,
    FaUser,
    FaUserShield,
    FaGem,
    FaPowerOff,
    FaQuestionCircle
} from 'react-icons/fa';
import { GoArchive } from 'react-icons/go';
import type { IconType } from 'react-icons';
import { useTranslation } from 'react-i18next';

import { useOrders } from '../../context/OrdersContext';

import styles from './userSection.module.css';

/** Opción del menú de la cuenta; coincide con su clave de traducción. */
export type AccountMenuItemId =
    | 'orders'
    | 'settings'
    | 'privacy'
    | 'premium'
    | 'help'
    | 'logout';

/** Opción del menú con su ícono y destino. */
interface AccountMenuItem {
    id: AccountMenuItemId;
    icon: IconType;
    /** Ruta destino; las opciones sin ruta aún no están disponibles. */
    path?: string;
    /** Estilo especial de la opción. */
    tone?: 'premium' | 'danger';
}

/** Opciones del menú, en el orden en que se muestran. */
const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
    { id: 'orders', icon: GoArchive, path: '/cuenta/pedidos' },
    { id: 'settings', icon: FaCog },
    { id: 'privacy', icon: FaUserShield },
    { id: 'premium', icon: FaGem, tone: 'premium' },
    { id: 'help', icon: FaQuestionCircle },
    { id: 'logout', icon: FaPowerOff, tone: 'danger' }
];

/**
 * Construye las clases de una opción del menú.
 *
 * @param item Opción del menú.
 * @param isActive Indica si es la opción de la página actual.
 * @return Las clases de la opción.
 */
function getMenuItemClassName(item: AccountMenuItem, isActive: boolean) {
    return [
        styles.menuItem,
        item.tone && styles[item.tone],
        isActive && styles.menuItemActive
    ]
        .filter(Boolean)
        .join(' ');
}

/**
 * Muestra el ícono y el nombre de una opción, y avisa si aún no está
 * disponible.
 *
 * @param props Propiedades del componente.
 * @param props.item Opción del menú.
 * @return El contenido de la opción.
 */
function MenuItemContent({ item }: { item: AccountMenuItem }) {
    const { t } = useTranslation('account');

    return (
        <>
            <item.icon className={styles.icon} aria-hidden="true" />
            <span className={styles.menuLabel}>{t(`menu.${item.id}`)}</span>
            {!item.path && <span className={styles.comingSoon}>{t('comingSoon')}</span>}
        </>
    );
}

/** Propiedades de UserSection. */
interface UserSectionProps {
    /** Opción del menú que corresponde a la página actual. */
    activeItemId?: AccountMenuItemId;
}

/**
 * Muestra el perfil del cliente (nombre de su última orden y cantidad de
 * pedidos) y el menú de la cuenta.
 *
 * @param props Propiedades del componente.
 * @return El perfil y el menú.
 */
export default function UserSection({ activeItemId }: UserSectionProps) {
    const { orders } = useOrders();
    const { t } = useTranslation('account');
    const customerName = orders[0]?.customer.fullName || t('guestName');

    return (
        <div className={styles.userSection}>
            <div className={styles.profile}>
                <div className={styles.avatar}>
                    <FaUser aria-hidden="true" />
                </div>

                <div className={styles.profileText}>
                    <h2 className={styles.username}>{customerName}</h2>
                    <p className={styles.orderCount}>
                        {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
                    </p>
                </div>
            </div>

            <nav className={styles.menu} aria-label={t('menu.label')}>
                {ACCOUNT_MENU_ITEMS.map((item) => {
                    const isActive = item.id === activeItemId;

                    return item.path ? (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={getMenuItemClassName(item, isActive)}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <MenuItemContent item={item} />
                        </Link>
                    ) : (
                        <button
                            key={item.id}
                            type="button"
                            className={getMenuItemClassName(item, false)}
                            disabled
                        >
                            <MenuItemContent item={item} />
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
