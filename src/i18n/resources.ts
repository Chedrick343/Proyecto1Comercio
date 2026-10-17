import account from './locales/es/account.json';
import cart from './locales/es/cart.json';
import catalog from './locales/es/catalog.json';
import checkout from './locales/es/checkout.json';
import common from './locales/es/common.json';
import errors from './locales/es/errors.json';
import orders from './locales/es/orders.json';
import product from './locales/es/product.json';

export const DEFAULT_LANGUAGE = 'es';

export const resources = {
    es: { account, cart, catalog, checkout, common, errors, orders, product }
} as const;

export const NAMESPACES = Object.keys(resources[DEFAULT_LANGUAGE]) as Array<
    keyof (typeof resources)[typeof DEFAULT_LANGUAGE]
>;
