import type { ValidationMessageKey } from './checkoutTypes';

export type PaymentMethod = 'SAVED_CARD' | 'NEW_CARD';

export interface NewPaymentCard {
    cardholder: string;
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    securityCode: string;
}

export type PaymentCardErrors = Partial<
    Record<keyof NewPaymentCard, ValidationMessageKey>
>;

export interface SavedPaymentCard {
    brand: string;
    lastFourDigits: string;
}

export const DEFAULT_SAVED_CARD: SavedPaymentCard = {
    brand: 'Mastercard',
    lastFourDigits: '4821'
};

export const INITIAL_NEW_PAYMENT_CARD: NewPaymentCard = {
    cardholder: '',
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    securityCode: ''
};

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

export function getLastFourDigits(cardNumber: string): string {
    return cardNumber.replace(/\D/g, '').slice(-4);
}

export function getMaskedCardNumber(lastFourDigits: string): string {
    return `••••  ••••  ••••  ${lastFourDigits || '••••'}`;
}