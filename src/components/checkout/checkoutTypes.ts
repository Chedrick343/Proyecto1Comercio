/**
 * @fileoverview Tipos y valores iniciales del formulario de envío del checkout.
 */

import type checkoutMessages from '../../i18n/locales/es/checkout.json';

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