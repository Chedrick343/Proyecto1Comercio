/**
 * @fileoverview Validación del formulario de envío del checkout.
 */

import { isValidEmail } from '../../utils/isValidEmail';
import type {
    ShippingDetails,
    ShippingFieldErrors
} from './checkoutTypes';

/**
 * Valida los datos de envío. Todos los campos son obligatorios excepto las
 * indicaciones; el teléfono debe tener entre 8 y 15 dígitos.
 *
 * @param details Datos de envío a validar.
 * @return Los errores por campo; un objeto vacío si todo es válido.
 */
export function validateShippingDetails(
    details: ShippingDetails
): ShippingFieldErrors {
    const errors: ShippingFieldErrors = {};

    if (!details.fullName.trim()) {
        errors.fullName = 'fullNameRequired';
    }

    if (!details.email.trim()) {
        errors.email = 'emailRequired';
    } else if (!isValidEmail(details.email)) {
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