/**
 * @fileoverview Servicio de cambios de productos. Los cambios del
 * administrador se envían al mismo Cloudflare Worker que guarda las órdenes,
 * junto con su token; el Worker verifica el token, valida los valores y los
 * escribe en el índice de productos de Algolia.
 */

import { searchClient } from '../../utils/algolia';
import { clearAdminToken, getAdminToken } from '../adminSession/adminSessionService';

/** Dirección del Cloudflare Worker; es el mismo que guarda las órdenes. */
const workerUrl = import.meta.env.VITE_ORDERS_WORKER_URL;

/** Dato de un producto que puede cambiar el administrador. */
export type EditableField = 'retailPrice' | 'businessPrice' | 'businessMinimum' | 'branchStock';

/** Un dato modificado, con su valor anterior y el nuevo. */
export interface FieldChange {
    field: EditableField;
    /** Sucursal del cambio; solo para las unidades por sucursal. */
    branchId?: string;
    previousValue: number;
    newValue: number;
}

/** Resultado de enviar un cambio al Worker. */
export interface ProductChangeResult {
    saved: boolean;
    /** Indica que falta el token del administrador o que venció. */
    sessionExpired?: boolean;
    /** Mensaje del Worker cuando rechaza el cambio por un valor inválido. */
    errorMessage?: string;
}

/**
 * Envía una petición al Worker con el token del administrador. Nunca lanza
 * un error: si algo falla, lo registra y devuelve el motivo. Si se guardó,
 * limpia la caché de búsquedas para que las consultas siguientes lean los
 * valores nuevos.
 *
 * @param path Ruta del Worker.
 * @param body Contenido de la petición.
 * @param adminEmail Correo del administrador con sesión iniciada.
 * @return Si se guardó y, si no, el motivo.
 */
async function sendToWorker(path: string, body: object, adminEmail: string): Promise<ProductChangeResult> {
    if (!workerUrl) {
        console.error('Falta VITE_ORDERS_WORKER_URL; no se pueden guardar cambios de productos.');
        return { saved: false };
    }

    const token = getAdminToken(adminEmail);

    if (!token) {
        console.error('No hay un token de administrador válido; hay que volver a iniciar sesión.');
        return { saved: false, sessionExpired: true };
    }

    try {
        const response = await fetch(new URL(path, workerUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const responseBody: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
            console.error('El Worker rechazó el token del administrador.');
            clearAdminToken();
            return { saved: false, sessionExpired: true };
        }

        if (!response.ok) {
            const errorMessage = (responseBody as { error?: unknown } | null)?.error;

            console.error(`El Worker rechazó ${path} (HTTP ${response.status}):`, responseBody);
            return {
                saved: false,
                errorMessage: response.status === 400 && typeof errorMessage === 'string' ? errorMessage : undefined
            };
        }

        await searchClient?.clearCache();
        return { saved: true };
    } catch (error) {
        console.error(`No se pudo contactar al Worker para ${path}:`, error);
        return { saved: false };
    }
}

/**
 * Guarda en Algolia los cambios del administrador sobre un producto.
 *
 * @param productId Identificador del producto.
 * @param changes Datos modificados.
 * @param adminEmail Correo del administrador con sesión iniciada.
 * @return Si se guardaron y, si no, el motivo.
 */
export async function saveProductChanges(
    productId: string,
    changes: FieldChange[],
    adminEmail: string
): Promise<ProductChangeResult> {
    console.log(`Enviando al Worker los cambios de ${productId}:`, changes);

    const result = await sendToWorker(
        'product-changes',
        { productId, changes: changes.map(({ field, branchId, newValue }) => ({ field, branchId, newValue })) },
        adminEmail
    );

    if (result.saved) {
        console.log(`Cambios de ${productId} guardados en Algolia.`);
    }

    return result;
}
