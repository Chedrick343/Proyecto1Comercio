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

export type AccountMenuItemId =
    | 'orders'
    | 'settings'
    | 'privacy'
    | 'premium'
    | 'help'
    | 'logout';

interface AccountMenuItem {
    id: AccountMenuItemId;
    icon: IconType;
    path?: string;
    tone?: 'premium' | 'danger';
}

const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
    { id: 'orders', icon: GoArchive, path: '/cuenta/pedidos' },
    { id: 'settings', icon: FaCog },
    { id: 'privacy', icon: FaUserShield },
    { id: 'premium', icon: FaGem, tone: 'premium' },
    { id: 'help', icon: FaQuestionCircle },
    { id: 'logout', icon: FaPowerOff, tone: 'danger' }
];

function getMenuItemClassName(item: AccountMenuItem, isActive: boolean) {
    return [
        styles.menuItem,
        item.tone && styles[item.tone],
        isActive && styles.menuItemActive
    ]
        .filter(Boolean)
        .join(' ');
}

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

interface UserSectionProps {
    activeItemId?: AccountMenuItemId;
}

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
