/**
 * @fileoverview Validación del formulario de inicio de sesión.
 */

import type authMessages from '../../i18n/locales/es/auth.json';
import type { LoginCredentials } from '../../session/authService';
import { isValidEmail } from '../../utils/isValidEmail';

/** Clave de traducción de un mensaje de validación del inicio de sesión. */
export type LoginValidationKey = keyof typeof authMessages.validation;

/** Mensaje de validación de cada campo inválido del formulario. */
export type LoginFieldErrors = Partial<Record<keyof LoginCredentials, LoginValidationKey>>;

/**
 * Valida que el correo tenga un formato válido y que la contraseña no esté vacía.
 *
 * @param credentials Credenciales ingresadas.
 * @return Los errores por campo; un objeto vacío si todo es válido.
 */
export function validateLoginCredentials(credentials: LoginCredentials): LoginFieldErrors {
    const errors: LoginFieldErrors = {};

    if (!credentials.email.trim()) {
        errors.email = 'emailRequired';
    } else if (!isValidEmail(credentials.email)) {
        errors.email = 'emailInvalid';
    }

    if (!credentials.password) {
        errors.password = 'passwordRequired';
    }

    return errors;
}
