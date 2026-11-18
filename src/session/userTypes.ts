/**
 * @fileoverview Tipos de los usuarios de la tienda y sus roles.
 */

/** Roles admitidos, en el orden en que se presentan. */
export const USER_ROLES = ['B2C', 'B2B', 'ADMIN'] as const;

/** Rol que determina las funciones y condiciones comerciales del usuario. */
export type UserRole = (typeof USER_ROLES)[number];

/** Empresa que representa un cliente B2B. */
export interface Company {
    name: string;
    /** Cédula jurídica de la empresa. */
    taxId: string;
}

/** Dirección de entrega guardada en la cuenta del usuario. */
export interface SavedAddress {
    fullName: string;
    phone: string;
    province: string;
    canton: string;
    address: string;
    /** Indicaciones adicionales para la entrega; puede estar vacío. */
    deliveryNotes: string;
    /**
     * Sucursal que se elige automáticamente al iniciar sesión; si no existe,
     * el usuario elige la sucursal en cada compra.
     */
    defaultBranchId?: string;
}

/** Usuario con sesión iniciada. No incluye datos de autenticación. */
export interface User {
    /** Identificador del usuario; coincide con su correo normalizado. */
    id: string;
    name: string;
    email: string;
    role: UserRole;
    /** Empresa del usuario; solo existe para clientes B2B. */
    company?: Company;
    /** Dirección de entrega guardada; es opcional. */
    savedAddress?: SavedAddress;
}

/**
 * Verifica si un valor es un rol admitido.
 *
 * @param value Valor a verificar.
 * @return Verdadero si el valor es uno de USER_ROLES.
 */
export const isUserRole = (value: unknown): value is UserRole =>
    USER_ROLES.includes(value as UserRole);

/**
 * Obtiene el primer nombre de un usuario, para mostrarlo en espacios reducidos.
 *
 * @param user Usuario.
 * @return La primera palabra de su nombre.
 */
export const getFirstName = (user: User): string => user.name.trim().split(/\s+/)[0];

/**
 * Verifica si un valor es un objeto no nulo.
 *
 * @param value Valor a verificar.
 * @return Verdadero si el valor es un objeto.
 */
const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Verifica si un valor tiene la forma de una empresa.
 *
 * @param value Valor a verificar.
 * @return Verdadero si el valor tiene nombre y cédula jurídica.
 */
export const isCompany = (value: unknown): value is Company =>
    isObject(value) &&
    typeof value.name === 'string' &&
    typeof value.taxId === 'string';

/**
 * Verifica si un valor tiene la forma de una dirección guardada.
 *
 * @param value Valor a verificar.
 * @return Verdadero si el valor tiene todos los campos de la dirección.
 */
export const isSavedAddress = (value: unknown): value is SavedAddress =>
    isObject(value) &&
    typeof value.fullName === 'string' &&
    typeof value.phone === 'string' &&
    typeof value.province === 'string' &&
    typeof value.canton === 'string' &&
    typeof value.address === 'string' &&
    typeof value.deliveryNotes === 'string' &&
    (value.defaultBranchId === undefined || typeof value.defaultBranchId === 'string');

/**
 * Verifica si un valor tiene la forma de un usuario con un rol admitido.
 *
 * @param value Valor a verificar, por ejemplo uno recuperado de localStorage.
 * @return Verdadero si el valor es un usuario válido.
 */
export const isUser = (value: unknown): value is User =>
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    isUserRole(value.role) &&
    (value.company === undefined || isCompany(value.company)) &&
    (value.savedAddress === undefined || isSavedAddress(value.savedAddress));
