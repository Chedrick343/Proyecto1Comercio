/**
 * @fileoverview Precio que le corresponde a cada tipo de cliente. El cliente
 * B2B compra con precio B2B; los demás (invitado, cliente B2C y
 * administrador) ven el precio B2C. También valida que la información
 * comercial del producto permita venderlo.
 */

import type { User } from '../session/userTypes';
import type { Product } from '../utils/Products';

/** Tipo de precio que se aplica: de consumidor final o de empresa. */
export type PriceTier = 'B2C' | 'B2B';

/** Motivo por el que un producto no tiene un precio válido para un cliente. */
export type PriceProblem =
    /** El precio falta, es 0 o es negativo. */
    | 'INVALID_AMOUNT'
    /** El precio de empresa es mayor que el de consumidor final. */
    | 'BUSINESS_PRICE_ABOVE_RETAIL'
    /** El producto no se vende a este tipo de cliente. */
    | 'NOT_SOLD_TO_TIER';

/** Precio de un producto para un tipo de cliente. */
export interface CustomerPrice {
    tier: PriceTier;
    amount: number;
    currency: string;
    /** Motivo por el que el precio no es válido, o null si se puede vender. */
    problem: PriceProblem | null;
}

/**
 * Obtiene el tipo de precio que le corresponde a quien usa la tienda.
 *
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @return B2B para el cliente B2B, y B2C para todos los demás.
 */
export const getPriceTier = (user: User | null): PriceTier =>
    user?.role === 'B2B' ? 'B2B' : 'B2C';

/**
 * Indica si un monto sirve como precio de venta.
 *
 * @param amount Monto a revisar.
 * @return Verdadero si es un número finito mayor que 0.
 */
export const isValidPriceAmount = (amount: number): boolean =>
    Number.isFinite(amount) && amount > 0;

/**
 * Busca el problema que impide vender un producto a un tipo de cliente.
 *
 * @param product Producto a revisar.
 * @param tier Tipo de precio.
 * @return El problema encontrado, o null si el precio es válido.
 */
function findPriceProblem(product: Product, tier: PriceTier): PriceProblem | null {
    const conditions = tier === 'B2B' ? product.b2b : product.b2c;

    if (!conditions.enabled) {
        return 'NOT_SOLD_TO_TIER';
    }

    if (!isValidPriceAmount(conditions.price)) {
        return 'INVALID_AMOUNT';
    }

    if (tier === 'B2B' && product.b2b.price > product.b2c.price) {
        return 'BUSINESS_PRICE_ABOVE_RETAIL';
    }

    return null;
}

/**
 * Obtiene el precio de un producto para un tipo de cliente.
 *
 * @param product Producto a consultar.
 * @param tier Tipo de precio.
 * @return El precio, su moneda y el problema que impide venderlo, si hay uno.
 */
export function getCustomerPrice(product: Product, tier: PriceTier): CustomerPrice {
    const conditions = tier === 'B2B' ? product.b2b : product.b2c;
    const problem = findPriceProblem(product, tier);

    if (problem) {
        console.error(`Precio ${tier} no válido para ${product.objectID}: ${problem}.`);
    }

    return {
        tier,
        amount: conditions.price,
        currency: conditions.currency,
        problem
    };
}

/**
 * Calcula cuánto ahorra una empresa frente al precio de consumidor final.
 * Se calcula con los precios y no con businessDiscount, para que siempre
 * coincida con lo que se cobra.
 *
 * @param product Producto a consultar.
 * @return El porcentaje de ahorro redondeado, o 0 si no hay ahorro.
 */
export function getBusinessSavingsPercent(product: Product): number {
    if (!isValidPriceAmount(product.b2c.price) || product.b2b.price >= product.b2c.price) {
        return 0;
    }

    return Math.round((1 - product.b2b.price / product.b2c.price) * 100);
}
