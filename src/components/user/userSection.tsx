/**
 * @fileoverview Perfil y menú de la cuenta del cliente.
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaChartBar,
    FaCog,
    FaUser,
    FaUserShield,
    FaGem,
    FaPowerOff,
    FaQuestionCircle,
    FaSignInAlt
} from 'react-icons/fa';
import { GoArchive } from 'react-icons/go';
import type { IconType } from 'react-icons';
import { useTranslation } from 'react-i18next';

import { useOrders } from '../../context/OrdersContext';
import { useSession } from '../../context/SessionContext';
import { hasPermission } from '../../session/permissions';
import { ADMIN_PATH } from '../admin/adminRoutes';
import { createLoginRedirectState, LOGIN_PATH } from '../login/loginRedirect';
import LogoutConfirmDialog from './LogoutConfirmDialog';

import styles from './userSection.module.css';

/** Opción del menú de la cuenta; coincide con su clave de traducción. */
export type AccountMenuItemId =
    | 'admin'
    | 'orders'
    | 'settings'
    | 'privacy'
    | 'premium'
    | 'help';

/** Estilo especial de una opción del menú. */
type MenuItemTone = 'premium' | 'danger';

/** Opción del menú con su ícono y destino. */
interface AccountMenuItem {
    id: AccountMenuItemId;
    icon: IconType;
    /** Ruta destino; las opciones sin ruta aún no están disponibles. */
    path?: string;
    tone?: MenuItemTone;
}

/** Opción de los pedidos propios; se oculta a quien no tiene pedidos, como el administrador. */
const ORDERS_MENU_ITEM: AccountMenuItem = { id: 'orders', icon: GoArchive, path: '/cuenta/pedidos' };

/**
 * Opciones del menú disponibles para todos, en el orden en que se muestran.
 * La opción de iniciar o cerrar sesión se agrega al final según el estado de
 * la sesión.
 */
const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
    { id: 'settings', icon: FaCog },
    { id: 'privacy', icon: FaUserShield },
    { id: 'premium', icon: FaGem, tone: 'premium' },
    { id: 'help', icon: FaQuestionCircle }
];

/** Opción del panel administrativo; solo se muestra a quien puede verlo, al inicio del menú. */
const ADMIN_MENU_ITEM: AccountMenuItem = { id: 'admin', icon: FaChartBar, path: ADMIN_PATH };

/**
 * Construye las clases de una opción del menú.
 *
 * @param tone Estilo especial de la opción, si tiene.
 * @param isActive Indica si es la opción de la página actual.
 * @return Las clases de la opción.
 */
function getMenuItemClassName(tone: MenuItemTone | undefined, isActive: boolean) {
    return [
        styles.menuItem,
        tone && styles[tone],
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

/**
 * Muestra los datos de quien usa la tienda: con sesión iniciada, su nombre,
 * rol, tipo de usuario y empresa; la cantidad de pedidos solo aparece si el
 * usuario puede tener pedidos propios.
 *
 * @return El perfil.
 */
function Profile() {
    const { t } = useTranslation(['account', 'auth']);
    const { currentUser } = useSession();
    const { orders } = useOrders();
    const canViewOwnOrders = hasPermission(currentUser, 'VIEW_OWN_ORDERS');

    return (
        <div className={styles.profile}>
            <div className={styles.avatar}>
                <FaUser aria-hidden="true" />
            </div>

            <div className={styles.profileText}>
                <h2 className={styles.username}>{currentUser?.name ?? t('account:guestName')}</h2>

                {currentUser && (
                    <span className={styles.roleBadge}>{t(`auth:roles.${currentUser.role}`)}</span>
                )}

                {currentUser && (
                    <p className={styles.profileDetail}>
                        {t('auth:session.userType', { type: t(`auth:userTypes.${currentUser.role}`) })}
                    </p>
                )}

                {currentUser?.company && (
                    <p className={styles.profileDetail}>
                        {t('auth:session.company', { name: currentUser.company.name })}
                    </p>
                )}

                {canViewOwnOrders && (
                    <p className={styles.profileDetail}>
                        {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Opción final del menú: pide confirmar el cierre de sesión y luego lleva al
 * catálogo o, como invitado, lleva al inicio de sesión.
 *
 * @return El botón para cerrar sesión con su confirmación, o el enlace para
 *     iniciar sesión.
 */
function SessionMenuItem() {
    const { t } = useTranslation('account');
    const { currentUser, endSession } = useSession();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

    /** Cierra la sesión y sale de la cuenta, que ya no pertenece a nadie. */
    const handleLogout = () => {
        setIsLogoutDialogOpen(false);
        endSession();
        navigate('/', { replace: true });
    };

    if (!currentUser) {
        return (
            <Link
                to={LOGIN_PATH}
                state={createLoginRedirectState(location)}
                className={getMenuItemClassName(undefined, false)}
            >
                <FaSignInAlt className={styles.icon} aria-hidden="true" />
                <span className={styles.menuLabel}>{t('menu.login')}</span>
            </Link>
        );
    }

    return (
        <>
            <button
                type="button"
                className={getMenuItemClassName('danger', false)}
                aria-haspopup="dialog"
                onClick={() => setIsLogoutDialogOpen(true)}
            >
                <FaPowerOff className={styles.icon} aria-hidden="true" />
                <span className={styles.menuLabel}>{t('menu.logout')}</span>
            </button>

            <LogoutConfirmDialog
                userName={currentUser.name}
                isOpen={isLogoutDialogOpen}
                onClose={() => setIsLogoutDialogOpen(false)}
                onConfirm={handleLogout}
            />
        </>
    );
}

/** Propiedades de UserSection. */
interface UserSectionProps {
    /** Opción del menú que corresponde a la página actual. */
    activeItemId?: AccountMenuItemId;
}

/**
 * Muestra el perfil del usuario y el menú de la cuenta.
 *
 * @param props Propiedades del componente.
 * @return El perfil y el menú.
 */
export default function UserSection({ activeItemId }: UserSectionProps) {
    const { t } = useTranslation('account');
    const { currentUser } = useSession();

    const menuItems: AccountMenuItem[] = [];

    if (hasPermission(currentUser, 'VIEW_ADMIN_INFORMATION')) {
        menuItems.push(ADMIN_MENU_ITEM);
    }

    if (hasPermission(currentUser, 'VIEW_OWN_ORDERS')) {
        menuItems.push(ORDERS_MENU_ITEM);
    }

    menuItems.push(...ACCOUNT_MENU_ITEMS);

    return (
        <div className={styles.userSection}>
            <Profile />

            <nav className={styles.menu} aria-label={t('menu.label')}>
                {menuItems.map((item) => {
                    const isActive = item.id === activeItemId;

                    return item.path ? (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={getMenuItemClassName(item.tone, isActive)}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <MenuItemContent item={item} />
                        </Link>
                    ) : (
                        <button
                            key={item.id}
                            type="button"
                            className={getMenuItemClassName(item.tone, false)}
                            disabled
                        >
                            <MenuItemContent item={item} />
                        </button>
                    );
                })}

                <SessionMenuItem />
            </nav>
        </div>
    );
}
