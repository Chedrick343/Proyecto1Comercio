/**
 * @fileoverview Tipos, validación y formato de las tarjetas de pago del checkout.
 */

import type { ValidationMessageKey } from './checkoutTypes';

/** Forma de pago elegida: la tarjeta guardada o una nueva. */
export type PaymentMethod = 'SAVED_CARD' | 'NEW_CARD';

/** Datos de una tarjeta nueva, tal como se ingresan en el formulario. */
export interface NewPaymentCard {
    cardholder: string;
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
}

/** Mensaje de validación de cada campo inválido de la tarjeta. */
export type PaymentCardErrors = Partial<
    Record<keyof NewPaymentCard, ValidationMessageKey>
>;

/** Tarjeta guardada en la cuenta del cliente. */
export interface SavedPaymentCard {
    brand: string;
    lastFourDigits: string;
}

/** Tarjeta guardada de demostración. */
export const DEFAULT_SAVED_CARD: SavedPaymentCard = {
    brand: 'Mastercard',
    lastFourDigits: '4821'
};

/** Formulario de tarjeta nueva vacío. */
export const INITIAL_NEW_PAYMENT_CARD: NewPaymentCard = {
    cardholder: '',
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    securityCode: ''
};

/**
 * Valida una tarjeta nueva: titular obligatorio, número de 13 a 19 dígitos,
 * fecha de vencimiento no pasada y código de seguridad de 3 o 4 dígitos.
 *
 * @param card Datos de la tarjeta.
 * @return Los errores por campo; un objeto vacío si todo es válido.
 */
export function validatePaymentCard(card: NewPaymentCard): PaymentCardErrors {
    const errors: PaymentCardErrors = {};
    const cardNumberDigits = card.cardNumber.replace(/\D/g, '');

    if (!card.cardholder.trim()) {
        errors.cardholder = 'cardholderRequired';
    }

    if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
        errors.cardNumber = 'cardNumberInvalid';
    }

    if (!card.expirationMonth || !card.expirationYear) {
        errors.expirationMonth = 'expirationRequired';
    } else {
        const expirationDate = new Date(
            Number(card.expirationYear),
            Number(card.expirationMonth) - 1,
            1
        );
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        if (expirationDate < currentMonth) {
            errors.expirationMonth = 'cardExpired';
        }
    }

    if (!/^\d{3,4}$/.test(card.securityCode)) {
        errors.securityCode = 'securityCodeInvalid';
    }

    return errors;
}

/**
 * Obtiene los últimos cuatro dígitos de un número de tarjeta.
 *
 * @param cardNumber Número de tarjeta, con o sin separadores.
 * @return Los últimos cuatro dígitos.
 */
export function getLastFourDigits(cardNumber: string): string {
    return cardNumber.replace(/\D/g, '').slice(-4);
}

/**
 * Enmascara un número de tarjeta mostrando solo sus últimos dígitos.
 *
 * @param lastFourDigits Últimos cuatro dígitos; si está vacío se enmascaran también.
 * @return El número enmascarado en grupos de cuatro.
 */
export function getMaskedCardNumber(lastFourDigits: string): string {
    return `••••  ••••  ••••  ${lastFourDigits || '••••'}`;
}