/**
 * @fileoverview Permisos de cada rol. Es el único lugar donde se decide qué
 * puede hacer cada tipo de usuario; los componentes consultan un permiso en
 * lugar de preguntar por el rol.
 */

import type { User, UserRole } from './userTypes';

/** Acción de la tienda que requiere permiso. */
export type Permission =
    | 'VIEW_CATALOG'
    | 'SEARCH_PRODUCTS'
    | 'ADD_TO_CART'
    | 'CHECKOUT'
    | 'VIEW_OWN_ORDERS'
    | 'VIEW_ALL_ORDERS'
    | 'VIEW_ADMIN_INFORMATION'
    | 'EDIT_STORE_DATA';

/** Quien usa la tienda: un rol o un invitado sin sesión. */
export type AccessLevel = UserRole | 'GUEST';

/**
 * Permisos de cada rol, según la tabla de control de acceso del proyecto.
 * El invitado compra con las mismas condiciones que un cliente B2C; sus
 * órdenes quedan asociadas al identificador de invitado de este navegador.
 */
const PERMISSIONS_BY_ACCESS_LEVEL: Record<AccessLevel, Permission[]> = {
    GUEST: ['VIEW_CATALOG', 'SEARCH_PRODUCTS', 'ADD_TO_CART', 'CHECKOUT', 'VIEW_OWN_ORDERS'],
    B2C: ['VIEW_CATALOG', 'SEARCH_PRODUCTS', 'ADD_TO_CART', 'CHECKOUT', 'VIEW_OWN_ORDERS'],
    B2B: ['VIEW_CATALOG', 'SEARCH_PRODUCTS', 'ADD_TO_CART', 'CHECKOUT', 'VIEW_OWN_ORDERS'],
    ADMIN: [
        'VIEW_CATALOG',
        'SEARCH_PRODUCTS',
        'VIEW_ALL_ORDERS',
        'VIEW_ADMIN_INFORMATION',
        'EDIT_STORE_DATA'
    ]
};

/**
 * Obtiene el nivel de acceso de quien usa la tienda.
 *
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @return El rol del usuario, o GUEST si no ha iniciado sesión.
 */
export const getAccessLevel = (user: User | null): AccessLevel => user?.role ?? 'GUEST';

/**
 * Obtiene todos los permisos de quien usa la tienda.
 *
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @return La lista de permisos de su nivel de acceso.
 */
export const getPermissions = (user: User | null): Permission[] =>
    PERMISSIONS_BY_ACCESS_LEVEL[getAccessLevel(user)];

/**
 * Indica si quien usa la tienda tiene un permiso.
 *
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @param permission Permiso a verificar.
 * @return Verdadero si su nivel de acceso incluye el permiso.
 */
export const hasPermission = (user: User | null, permission: Permission): boolean =>
    getPermissions(user).includes(permission);
