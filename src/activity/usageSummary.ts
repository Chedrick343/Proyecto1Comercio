/**
 * @fileoverview Métricas de uso de la tienda (totales, rankings y actividad
 * por usuario), calculadas a partir de los eventos registrados.
 */

import type { UserRole } from '../session/userTypes';
import {
    ANALYTICS_EVENT_TYPES,
    type AnalyticsEvent,
    type AnalyticsEventType,
    type AnalyticsSubject,
    type ProductSnapshot
} from './analyticsTypes';
import { getSubjectKey } from './eventPayloads';
import { getCategoryInterest } from './recommendations';
import { normalizeSearchQuery } from './userHistory';

/** Cantidad máxima de elementos en cada ranking. */
export const RANKING_LIMIT = 5;

/** Cantidad máxima de eventos en la tabla de actividad reciente. */
export const LATEST_EVENTS_LIMIT = 12;

/** Monto acumulado en una moneda. */
export interface CurrencyAmount {
    currency: string;
    amount: number;
}

/** Totales de uso de la tienda. */
export interface UsageTotals {
    productViews: number;
    /** Productos distintos que se visualizaron. */
    viewedProductCount: number;
    searches: number;
    /** Textos distintos que se buscaron, sin distinguir mayúsculas. */
    searchedTermCount: number;
    /** Unidades agregadas al carrito. */
    cartUnits: number;
    /** Veces que se agregó un producto al carrito. */
    cartAdditions: number;
    checkoutStarts: number;
    purchases: number;
    /** Monto vendido en cada moneda, ordenado por código de moneda. */
    sales: CurrencyAmount[];
}

/** Cantidad de eventos de un tipo. */
export interface EventTypeCount {
    type: AnalyticsEventType;
    count: number;
}

/**
 * Pasos del recorrido de compra, en orden. La búsqueda no forma parte: a un
 * producto también se llega navegando el catálogo.
 */
export const PURCHASE_FUNNEL_STEPS: AnalyticsEventType[] = [
    'PRODUCT_VIEW',
    'ADD_TO_CART',
    'CHECKOUT_START',
    'PURCHASE'
];

/** Paso del embudo de compra con las personas que lo realizaron. */
export interface FunnelStep {
    type: AnalyticsEventType;
    /** Usuarios e invitados distintos que realizaron el paso al menos una vez. */
    subjectCount: number;
}

/** Interés en una categoría, medido con vistas y productos agregados al carrito. */
export interface CategoryInterest {
    category: string;
    views: number;
    cartAdditions: number;
}

/** Paso del recorrido de compra de una sola persona. */
export interface JourneyStep {
    type: AnalyticsEventType;
    /** Veces que la persona realizó el paso. */
    count: number;
    /** Primera vez que lo realizó, en ISO 8601; no existe si no llegó al paso. */
    firstAt?: string;
}

/** Producto con la cantidad de veces que se visualizó. */
export interface ViewedProductCount {
    product: ProductSnapshot;
    viewCount: number;
}

/** Texto buscado con la cantidad de veces que se buscó. */
export interface SearchTermCount {
    /** Texto tal como se escribió la última vez. */
    query: string;
    count: number;
}

/** Usuario o invitado con un resumen de su actividad. */
export interface ActivitySubject {
    /** Clave del sujeto, obtenida con getSubjectKey. */
    key: string;
    subject: AnalyticsSubject;
    /** Rol con el que inició sesión por última vez; no existe para invitados. */
    role?: UserRole;
    eventCount: number;
    /** Fecha del último evento, en ISO 8601. */
    lastActivityAt: string;
}

/**
 * Suma los montos de las compras por moneda.
 *
 * @param purchases Eventos de compra.
 * @return El monto vendido en cada moneda, ordenado por código de moneda.
 */
function sumSalesByCurrency(purchases: AnalyticsEvent<'PURCHASE'>[]): CurrencyAmount[] {
    const amountByCurrency = new Map<string, number>();

    for (const { payload } of purchases) {
        amountByCurrency.set(
            payload.currency,
            (amountByCurrency.get(payload.currency) ?? 0) + payload.total
        );
    }

    return [...amountByCurrency]
        .map(([currency, amount]) => ({ currency, amount }))
        .sort((first, second) => first.currency.localeCompare(second.currency));
}

/**
 * Calcula los totales de uso.
 *
 * @param events Eventos a resumir.
 * @return Los totales de vistas, búsquedas, carrito, checkout y compras.
 */
export function summarizeUsage(events: AnalyticsEvent[]): UsageTotals {
    const productViews = events.filter((event) => event.type === 'PRODUCT_VIEW');
    const searches = events.filter((event) => event.type === 'SEARCH');
    const cartAdditions = events.filter((event) => event.type === 'ADD_TO_CART');
    const purchases = events.filter((event) => event.type === 'PURCHASE');

    return {
        productViews: productViews.length,
        viewedProductCount: new Set(productViews.map(({ payload }) => payload.productId)).size,
        searches: searches.length,
        searchedTermCount: new Set(
            searches.map(({ payload }) => normalizeSearchQuery(payload.query))
        ).size,
        cartUnits: cartAdditions.reduce((total, { payload }) => total + payload.quantity, 0),
        cartAdditions: cartAdditions.length,
        checkoutStarts: events.filter((event) => event.type === 'CHECKOUT_START').length,
        purchases: purchases.length,
        sales: sumSalesByCurrency(purchases)
    };
}

/**
 * Calcula qué parte de los checkouts iniciados terminó en una compra.
 *
 * @param totals Totales de uso.
 * @return Un valor entre 0 y 1, o null si no se inició ningún checkout.
 */
export function getCheckoutConversion(totals: UsageTotals): number | null {
    if (totals.checkoutStarts === 0) {
        return null;
    }

    // Old checkout starts may have been discarded by the storage limit.
    return Math.min(totals.purchases / totals.checkoutStarts, 1);
}

/**
 * Cuenta los eventos de cada tipo.
 *
 * @param events Eventos a contar.
 * @return Un conteo por tipo, en el orden de un recorrido de compra.
 */
export function countEventsByType(events: AnalyticsEvent[]): EventTypeCount[] {
    return ANALYTICS_EVENT_TYPES.map((type) => ({
        type,
        count: events.filter((event) => event.type === type).length
    }));
}

/**
 * Cuenta cuántos usuarios e invitados distintos llegaron a cada paso del
 * recorrido de compra. A diferencia de contar eventos, una persona que vio
 * diez productos cuenta una sola vez en ese paso.
 *
 * @param events Eventos a analizar.
 * @return Las personas de cada paso, en el orden del recorrido.
 */
export function getPurchaseFunnel(events: AnalyticsEvent[]): FunnelStep[] {
    return PURCHASE_FUNNEL_STEPS.map((type) => ({
        type,
        subjectCount: new Set(
            events
                .filter((event) => event.type === type)
                .map((event) => getSubjectKey(event.subject))
        ).size
    }));
}

/**
 * Cuenta las vistas y los productos agregados al carrito de cada categoría.
 * Incluye todas las categorías indicadas, aunque no tengan eventos. Se
 * ordenan con la misma puntuación que usan las recomendaciones, así que las
 * primeras son las que se recomiendan; los empates, en orden alfabético.
 *
 * @param events Eventos a analizar.
 * @param allCategories Categorías que se muestran siempre, por ejemplo las del catálogo.
 * @return Las categorías, de mayor a menor interés.
 */
export function getCategoryInterestBreakdown(
    events: AnalyticsEvent[],
    allCategories: string[] = []
): CategoryInterest[] {
    const interestByCategory = new Map<string, CategoryInterest>(
        allCategories.map((category) => [category, { category, views: 0, cartAdditions: 0 }])
    );

    for (const event of events) {
        if (event.type !== 'PRODUCT_VIEW' && event.type !== 'ADD_TO_CART') {
            continue;
        }

        const { category } = event.payload;

        if (!category) {
            continue;
        }

        const interest = interestByCategory.get(category)
            ?? { category, views: 0, cartAdditions: 0 };

        if (event.type === 'PRODUCT_VIEW') {
            interest.views += 1;
        } else {
            interest.cartAdditions += 1;
        }

        interestByCategory.set(category, interest);
    }

    const scores = getCategoryInterest(events);

    return [...interestByCategory.values()].sort(
        (first, second) =>
            (scores.get(second.category) ?? 0) - (scores.get(first.category) ?? 0)
            || first.category.localeCompare(second.category, 'es')
    );
}

/**
 * Describe hasta qué paso del recorrido de compra llegó una persona.
 *
 * @param events Eventos de una sola persona, del más antiguo al más reciente.
 * @return Cada paso con las veces que se realizó y la primera vez que ocurrió.
 */
export function getPurchaseJourney(events: AnalyticsEvent[]): JourneyStep[] {
    return PURCHASE_FUNNEL_STEPS.map((type) => {
        const stepEvents = events.filter((event) => event.type === type);

        return {
            type,
            count: stepEvents.length,
            firstAt: stepEvents.at(0)?.timestamp
        };
    });
}

/**
 * Agrupa elementos por clave y los ordena por cantidad. Cada grupo conserva
 * el elemento más reciente, y los empates favorecen al grupo usado más
 * recientemente.
 *
 * @param items Elementos ordenados del más antiguo al más reciente.
 * @param getKey Obtiene la clave del grupo de un elemento.
 * @param limit Cantidad máxima de grupos.
 * @return Los grupos más frecuentes con su elemento más reciente.
 * @template T
 */
function rankByFrequency<T>(
    items: T[],
    getKey: (item: T) => string,
    limit: number
): { latest: T; count: number }[] {
    const groups = new Map<string, { latest: T; count: number; lastIndex: number }>();

    items.forEach((item, index) => {
        const key = getKey(item);
        const count = (groups.get(key)?.count ?? 0) + 1;
        groups.set(key, { latest: item, count, lastIndex: index });
    });

    return [...groups.values()]
        .sort((first, second) => second.count - first.count || second.lastIndex - first.lastIndex)
        .slice(0, limit)
        .map(({ latest, count }) => ({ latest, count }));
}

/**
 * Obtiene los productos más visualizados.
 *
 * @param events Eventos, del más antiguo al más reciente.
 * @param limit Cantidad máxima de productos.
 * @return Los productos con más vistas, de mayor a menor.
 */
export function getMostViewedProducts(
    events: AnalyticsEvent[],
    limit: number = RANKING_LIMIT
): ViewedProductCount[] {
    return rankByFrequency(
        events.filter((event) => event.type === 'PRODUCT_VIEW'),
        ({ payload }) => payload.productId,
        limit
    ).map(({ latest, count }) => ({ product: latest.payload, viewCount: count }));
}

/**
 * Obtiene los textos más buscados, sin distinguir mayúsculas.
 *
 * @param events Eventos, del más antiguo al más reciente.
 * @param limit Cantidad máxima de textos.
 * @return Los textos con más búsquedas, de mayor a menor.
 */
export function getTopSearchTerms(
    events: AnalyticsEvent[],
    limit: number = RANKING_LIMIT
): SearchTermCount[] {
    return rankByFrequency(
        events.filter((event) => event.type === 'SEARCH'),
        ({ payload }) => normalizeSearchQuery(payload.query),
        limit
    ).map(({ latest, count }) => ({ query: latest.payload.query, count }));
}

/**
 * Obtiene los usuarios e invitados que generaron eventos.
 *
 * @param events Eventos, del más antiguo al más reciente.
 * @return Los sujetos, del que tuvo actividad más reciente al más antiguo.
 */
export function getActivitySubjects(events: AnalyticsEvent[]): ActivitySubject[] {
    const subjects = new Map<string, ActivitySubject>();

    for (const event of events) {
        const key = getSubjectKey(event.subject);
        const current = subjects.get(key);

        subjects.set(key, {
            key,
            subject: event.subject,
            role: event.type === 'LOGIN' ? event.payload.role : current?.role,
            eventCount: (current?.eventCount ?? 0) + 1,
            lastActivityAt: event.timestamp
        });
    }

    return [...subjects.values()].sort(
        (first, second) => second.lastActivityAt.localeCompare(first.lastActivityAt)
    );
}

/**
 * Obtiene los eventos más recientes.
 *
 * @param events Eventos, del más antiguo al más reciente.
 * @param limit Cantidad máxima de eventos.
 * @return Los últimos eventos, del más reciente al más antiguo.
 */
export const getLatestEvents = (
    events: AnalyticsEvent[],
    limit: number = LATEST_EVENTS_LIMIT
): AnalyticsEvent[] => events.slice(-limit).reverse();
