/**
 * @fileoverview Hash de contraseñas para la autenticación simulada.
 */

/**
 * Calcula el hash SHA-256 de una contraseña. El índice de usuarios solo
 * guarda este hash, para no exponer contraseñas en texto plano.
 *
 * @param password Contraseña ingresada.
 * @return El hash en hexadecimal.
 */
export async function hashPassword(password: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));

    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}
