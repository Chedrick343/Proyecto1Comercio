/**
 * @fileoverview Construcción de eventos y de la información que guardan.
 */

import type { User } from '../session/userTypes';
import { getMainCategory, type Product } from '../utils/Products';
import type {
    AnalyticsEvent,
    AnalyticsEventPayloads,
    AnalyticsEventType,
    AnalyticsSubject,
    ProductSnapshot
} from './analyticsTypes';

/**
 * Resume un producto para guardarlo en un evento.
 *
 * @param product Producto completo.
 * @return El resumen con los datos necesarios para mostrarlo después.
 */
export const toProductSnapshot = (product: Product): ProductSnapshot => ({
    productId: product.objectID,
    title: product.title,
    brand: product.brand,
    category: getMainCategory(product),
    imageUrl: product.image_url,
    price: product.b2c.price,
    currency: product.b2c.currency
});

/**
 * Obtiene el sujeto de analítica que corresponde a un usuario.
 *
 * @param user Usuario con sesión iniciada.
 * @return El sujeto identificado por el id del usuario.
 */
export const toUserSubject = (user: User): AnalyticsSubject => ({ type: 'user', id: user.id });

/**
 * Crea un evento con un identificador único y la fecha actual. Los
 * parámetros garantizan que el payload corresponda al tipo; la conversión
 * final solo es necesaria porque TypeScript no puede relacionar un tipo
 * genérico con la unión de eventos.
 *
 * @param type Tipo de evento.
 * @param payload Información del evento.
 * @param subject Quién realizó la acción.
 * @param date Momento del evento; por defecto, el actual.
 * @return El evento listo para guardarse.
 * @template T
 */
export function createAnalyticsEvent<T extends AnalyticsEventType>(
    type: T,
    payload: AnalyticsEventPayloads[T],
    subject: AnalyticsSubject,
    date: Date = new Date()
): AnalyticsEvent {
    return {
        id: crypto.randomUUID(),
        type,
        timestamp: date.toISOString(),
        subject,
        payload
    } as AnalyticsEvent;
}

/**
 * Indica si dos sujetos son la misma persona o sesión.
 *
 * @param first Primer sujeto.
 * @param second Segundo sujeto.
 * @return Verdadero si tienen el mismo tipo e identificador.
 */
export const isSameSubject = (first: AnalyticsSubject, second: AnalyticsSubject): boolean =>
    first.type === second.type && first.id === second.id;
