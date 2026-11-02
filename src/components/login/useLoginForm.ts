/**
 * @fileoverview Hook con el estado y el envío del formulario de inicio de sesión.
 */

import { useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { useSession } from '../../context/SessionContext';
import {
    authenticate,
    AuthError,
    type AuthErrorCode,
    type LoginCredentials
} from '../../session/authService';
import { focusFirstInvalidField } from '../checkout/focusFirstInvalidField';
import { getLoginRedirectPath } from './loginRedirect';
import {
    validateLoginCredentials,
    type LoginFieldErrors
} from './validateLoginCredentials';

/** Formulario de inicio de sesión vacío. */
const EMPTY_CREDENTIALS: LoginCredentials = { email: '', password: '' };

/**
 * Maneja el formulario de inicio de sesión: valida los campos, autentica al
 * usuario, inicia su sesión y lo regresa a la página de la que venía.
 *
 * @return Las credenciales, los errores, si se está verificando la cuenta y
 *     las funciones para editar un campo, rellenar ambos campos y enviar el
 *     formulario.
 */
export function useLoginForm() {
    const { startSession } = useSession();
    const navigate = useNavigate();
    const location = useLocation();

    const [credentials, setCredentials] = useState<LoginCredentials>(EMPTY_CREDENTIALS);
    const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
    const [authError, setAuthError] = useState<AuthErrorCode | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Actualiza un campo y quita su error y el error de autenticación.
     *
     * @param field Campo modificado.
     * @param value Nuevo valor.
     */
    const updateField = (field: keyof LoginCredentials, value: string) => {
        setCredentials((previousCredentials) => ({ ...previousCredentials, [field]: value }));
        setFieldErrors((previousErrors) => ({ ...previousErrors, [field]: undefined }));
        setAuthError(null);
    };

    /**
     * Reemplaza el correo y la contraseña de una vez, por ejemplo al elegir
     * una cuenta de prueba, y quita los errores mostrados.
     *
     * @param nextCredentials Credenciales a cargar en el formulario.
     */
    const fillCredentials = (nextCredentials: LoginCredentials) => {
        setCredentials(nextCredentials);
        setFieldErrors({});
        setAuthError(null);
    };

    /**
     * Valida el formulario y, si es correcto, intenta iniciar sesión.
     *
     * @param event Evento de envío del formulario.
     */
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const validationErrors = validateLoginCredentials(credentials);

        if (Object.keys(validationErrors).length > 0) {
            flushSync(() => setFieldErrors(validationErrors));
            focusFirstInvalidField(form);
            return;
        }

        setIsSubmitting(true);
        setAuthError(null);

        try {
            const user = await authenticate(credentials);
            startSession(user);
            navigate(getLoginRedirectPath(location.state), { replace: true });
        } catch (error) {
            if (!(error instanceof AuthError)) {
                console.error('Error inesperado al iniciar sesión:', error);
            }

            setAuthError(error instanceof AuthError ? error.code : 'unavailable');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        credentials,
        fieldErrors,
        authError,
        isSubmitting,
        updateField,
        fillCredentials,
        submit
    };
}
