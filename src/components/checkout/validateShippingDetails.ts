import type {
    ShippingDetails,
    ShippingFieldErrors
} from './checkoutTypes';

export function validateShippingDetails(
    details: ShippingDetails
): ShippingFieldErrors {
    const errors: ShippingFieldErrors = {};

    if (!details.fullName.trim()) {
        errors.fullName = 'Ingresa el nombre completo.';
    }

    if (!details.email.trim()) {
        errors.email = 'Ingresa el correo electrónico.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
        errors.email = 'Ingresa un correo electrónico válido.';
    }

    const phoneDigits = details.phone.replace(/\D/g, '');
    if (!details.phone.trim()) {
        errors.phone = 'Ingresa el teléfono de contacto.';
    } else if (phoneDigits.length < 8 || phoneDigits.length > 15) {
        errors.phone = 'Ingresa un teléfono válido de 8 a 15 dígitos.';
    }

    if (!details.province) {
        errors.province = 'Selecciona una provincia.';
    }

    if (!details.canton.trim()) {
        errors.canton = 'Ingresa el cantón.';
    }

    if (!details.address.trim()) {
        errors.address = 'Ingresa la dirección de entrega.';
    }

    return errors;
}