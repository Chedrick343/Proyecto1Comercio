/**
 * @fileoverview Tipos y valores iniciales del formulario de envío del checkout.
 */

import type checkoutMessages from '../../i18n/locales/es/checkout.json';
import type { SavedAddress } from '../../session/userTypes';

/** Clave de traducción de un mensaje de validación del checkout. */
export type ValidationMessageKey = keyof typeof checkoutMessages.validation;

/** Datos de contacto y entrega del cliente. */
export interface ShippingDetails {
    fullName: string;
    email: string;
    phone: string;
    province: string;
    /** Cantón dentro de la provincia. */
    canton: string;
    address: string;
    /** Indicaciones adicionales para la entrega; es opcional. */
    deliveryNotes: string;
}

/** Mensaje de validación de cada campo inválido del formulario de envío. */
export type ShippingFieldErrors = Partial<
    Record<keyof ShippingDetails, ValidationMessageKey>
>;

/** Dirección elegida en el checkout: la guardada en la cuenta o una nueva. */
export type AddressChoice = 'SAVED_ADDRESS' | 'NEW_ADDRESS';

/**
 * Qué se compra en la orden: todo el carrito, o solo lo disponible en la
 * sucursal elegida, dejando el resto en el carrito para otro pedido.
 */
export type PurchaseMode = 'WHOLE_CART' | 'AVAILABLE_ONLY';

/**
 * Convierte la dirección guardada de un usuario en datos de entrega.
 *
 * @param savedAddress Dirección guardada en la cuenta.
 * @param email Correo del usuario, que la dirección guardada no repite.
 * @return Los datos de entrega listos para la orden.
 */
export const savedAddressToShippingDetails = (
    savedAddress: SavedAddress,
    email: string
): ShippingDetails => ({
    fullName: savedAddress.fullName,
    email,
    phone: savedAddress.phone,
    province: savedAddress.province,
    canton: savedAddress.canton,
    address: savedAddress.address,
    deliveryNotes: savedAddress.deliveryNotes
});

/** Formulario de envío vacío. */
export const INITIAL_SHIPPING_DETAILS: ShippingDetails = {
    fullName: '',
    email: '',
    phone: '',
    province: '',
    canton: '',
    address: '',
    deliveryNotes: ''
};

/** Provincias de Costa Rica disponibles para el envío. */
export const COSTA_RICAN_PROVINCES = [
    'San José',
    'Alajuela',
    'Cartago',
    'Heredia',
    'Guanacaste',
    'Puntarenas',
    'Limón'
] as const;