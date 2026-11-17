/**
 * @fileoverview Token del administrador para escribir en Algolia. Al iniciar
 * sesión como ADMIN, el Cloudflare Worker verifica la contraseña y entrega un
 * token firmado; los cambios de productos lo envían para demostrar que vienen
 * del administrador.
 */

import type { LoginCredentials } from '../../session/authService';

/** Dirección del Cloudflare Worker; es el mismo que guarda las órdenes. */
const workerUrl = import.meta.env.VITE_ORDERS_WORKER_URL;

/** Clave de localStorage donde se guarda el token del administrador. */
const ADMIN_TOKEN_STORAGE_KEY = 'admin-token-v1';

/** Token guardado, con el correo al que pertenece y su vencimiento. */
interface StoredAdminToken {
    email: string;
    token: string;
    /** Fecha de vencimiento en milisegundos. */
    expiresAt: number;
}

/**
 * Pide al Worker un token para el administrador y lo guarda. Nunca lanza un
 * error: si falla, el administrador puede navegar igual, pero no podrá
 * guardar cambios de productos.
 *
 * @param credentials Correo y contraseña con los que inició sesión.
 */
export async function requestAdminToken(credentials: LoginCredentials) {
    if (!workerUrl) {
        console.error('Falta VITE_ORDERS_WORKER_URL; el administrador no podrá guardar cambios.');
        return;
    }

    try {
        const response = await fetch(new URL('admin-session', workerUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const body: unknown = await response.json().catch(() => null);
        const { token, expiresAt } = (body ?? {}) as { token?: unknown; expiresAt?: unknown };

        if (!response.ok || typeof token !== 'string' || typeof expiresAt !== 'number') {
            console.error(`El Worker no entregó el token del administrador (HTTP ${response.status}):`, body);
            return;
        }

        const storedToken: StoredAdminToken = {
            email: credentials.email.trim().toLowerCase(),
            token,
            expiresAt
        };

        localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, JSON.stringify(storedToken));
        console.log(`Token de administrador recibido; vence el ${new Date(expiresAt).toLocaleString()}.`);
    } catch (error) {
        console.error('No se pudo pedir el token del administrador:', error);
    }
}

/**
 * Obtiene el token guardado si pertenece al administrador indicado y todavía
 * no vence.
 *
 * @param email Correo del administrador con sesión iniciada.
 * @return El token, o null si no hay uno válido.
 */
export function getAdminToken(email: string): string | null {
    try {
        const storedValue = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
        const storedToken = storedValue ? (JSON.parse(storedValue) as StoredAdminToken) : null;

        if (!storedToken || storedToken.email !== email.trim().toLowerCase() || storedToken.expiresAt <= Date.now()) {
            return null;
        }

        return storedToken.token;
    } catch (error) {
        console.error('No se pudo leer el token del administrador:', error);
        return null;
    }
}

/** Borra el token del administrador, por ejemplo al cerrar sesión. */
export function clearAdminToken() {
    try {
        localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch (error) {
        console.error('No se pudo borrar el token del administrador:', error);
    }
}
