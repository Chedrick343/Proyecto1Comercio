/**
 * @fileoverview Tipos de los eventos de analítica: qué acciones se registran
 * y qué información guarda cada una.
 */

import type { UserRole } from '../session/userTypes';

/**
 * Resumen de un producto en el momento del evento. Se guarda completo para
 * mostrar historiales y recomendaciones sin volver a consultar Algolia.
 */
export interface ProductSnapshot {
    productId: string;
    title: string;
    brand: string;
    /** Categoría más específica del producto, si tiene. */
    category?: string;
    imageUrl: string;
    price: number;
    currency: string;
}

/** Información que guarda cada tipo de evento. */
export interface AnalyticsEventPayloads {
    /** Inicio de sesión de un usuario. */
    LOGIN: {
        role: UserRole;
    };

    /** Búsqueda de productos en el catálogo. */
    SEARCH: {
        query: string;
        resultCount: number;
    };

    /** Visualización del detalle de un producto. */
    PRODUCT_VIEW: ProductSnapshot;

    /** Producto agregado al carrito. */
    ADD_TO_CART: ProductSnapshot & {
        quantity: number;
    };

    /** Entrada al checkout con productos en el carrito. */
    CHECKOUT_START: {
        itemCount: number;
        total: number;
        currency: string;
    };

    /** Compra con pago aprobado. */
    PURCHASE: {
        orderNumber: string;
        itemCount: number;
        total: number;
        currency: string;
    };
}

/** Tipo de evento registrado. */
export type AnalyticsEventType = keyof AnalyticsEventPayloads;

/** Tipos de evento, en el orden en que ocurren en un recorrido de compra. */
export const ANALYTICS_EVENT_TYPES: AnalyticsEventType[] = [
    'LOGIN',
    'SEARCH',
    'PRODUCT_VIEW',
    'ADD_TO_CART',
    'CHECKOUT_START',
    'PURCHASE'
];

/**
 * Quién realizó la acción: un usuario con sesión iniciada o un invitado,
 * identificado por su sesión de navegador.
 */
export interface AnalyticsSubject {
    type: 'user' | 'guest';
    id: string;
}

/**
 * Evento registrado. Es una unión discriminada por type, así que al revisar
 * el tipo TypeScript conoce la forma exacta del payload.
 */
export type AnalyticsEvent<T extends AnalyticsEventType = AnalyticsEventType> = {
    [K in T]: {
        id: string;
        type: K;
        /** Fecha y hora del evento en ISO 8601. */
        timestamp: string;
        subject: AnalyticsSubject;
        payload: AnalyticsEventPayloads[K];
    };
}[T];
