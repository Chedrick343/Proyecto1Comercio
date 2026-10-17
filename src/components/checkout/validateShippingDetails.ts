import type {
    ShippingDetails,
    ShippingFieldErrors
} from './checkoutTypes';

export function validateShippingDetails(
    details: ShippingDetails
): ShippingFieldErrors {
    const errors: ShippingFieldErrors = {};

    if (!details.fullName.trim()) {
        errors.fullName = 'fullNameRequired';
    }

    if (!details.email.trim()) {
        errors.email = 'emailRequired';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
        errors.email = 'emailInvalid';
    }

    const phoneDigits = details.phone.replace(/\D/g, '');
    if (!details.phone.trim()) {
        errors.phone = 'phoneRequired';
    } else if (phoneDigits.length < 8 || phoneDigits.length > 15) {
        errors.phone = 'phoneInvalid';
    }

    if (!details.province) {
        errors.province = 'provinceRequired';
    }

    if (!details.canton.trim()) {
        errors.canton = 'cantonRequired';
    }

    if (!details.address.trim()) {
        errors.address = 'addressRequired';
    }

    return errors;
}