/**
 * @fileoverview Recursos de traducción agrupados por idioma y espacio de nombres.
 */

import account from './locales/es/account.json';
import cart from './locales/es/cart.json';
import catalog from './locales/es/catalog.json';
import checkout from './locales/es/checkout.json';
import common from './locales/es/common.json';
import errors from './locales/es/errors.json';
import orders from './locales/es/orders.json';
import policies from './locales/es/policies.json';
import product from './locales/es/product.json';

/** Idioma inicial y de respaldo de la interfaz. */
export const DEFAULT_LANGUAGE = 'es';

/** Traducciones disponibles, indexadas por idioma y luego por espacio de nombres. */
export const resources = {
    es: { account, cart, catalog, checkout, common, errors, orders, policies, product }
} as const;

/** Espacios de nombres de traducción que i18next debe cargar. */
export const NAMESPACES = Object.keys(resources[DEFAULT_LANGUAGE]) as Array<
    keyof (typeof resources)[typeof DEFAULT_LANGUAGE]
>;
