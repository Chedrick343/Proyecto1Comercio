/**
 * @fileoverview Identificador de la sesión de un invitado, para asociarle su
 * historial aunque no haya iniciado sesión.
 */

/** Clave de localStorage donde se guarda el identificador del invitado. */
const GUEST_SESSION_STORAGE_KEY = 'guest-session-id-v1';

/**
 * Crea un identificador de invitado nuevo.
 *
 * @return Un identificador con el formato guest-<uuid>.
 */
const createGuestSessionId = (): string => `guest-${crypto.randomUUID()}`;

/**
 * Obtiene el identificador del invitado de este navegador, creándolo la
 * primera vez. Se conserva entre visitas, así que el historial del invitado
 * también.
 *
 * @return El identificador del invitado.
 */
export function getGuestSessionId(): string {
    try {
        const storedId = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);

        if (storedId) {
            return storedId;
        }

        const newId = createGuestSessionId();
        localStorage.setItem(GUEST_SESSION_STORAGE_KEY, newId);
        return newId;
    } catch (error) {
        console.error('No se pudo recuperar la sesión del invitado:', error);
        return createGuestSessionId();
    }
}
