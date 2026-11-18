/**
 * @fileoverview Condición comercial B2B: cantidad mínima de compra por
 * producto. El cliente B2B debe comprar al menos b2b.minimumOrder unidades de
 * cada producto; para los demás clientes el mínimo es 1.
 */

import type { Product } from '../utils/Products';
import type { PriceTier } from './customerPrice';

/**
 * Obtiene el mínimo de compra B2B de un producto. Un valor faltante o menor
 * que 1 se toma como 1, para no bloquear la compra por un dato mal cargado.
 *
 * @param product Producto a consultar.
 * @return Las unidades mínimas que debe comprar una empresa.
 */
export function getBusinessMinimum(product: Product): number {
    const minimum = Math.floor(product.b2b.minimumOrder);
    return Number.isFinite(minimum) && minimum > 1 ? minimum : 1;
}

/**
 * Obtiene cuántas unidades de un producto debe comprar como mínimo un tipo de
 * cliente.
 *
 * @param product Producto a consultar.
 * @param tier Tipo de precio del cliente.
 * @return El mínimo B2B para empresas, o 1 para los demás.
 */
export const getMinimumQuantity = (product: Product, tier: PriceTier): number =>
    tier === 'B2B' ? getBusinessMinimum(product) : 1;

/**
 * Indica si una cantidad no alcanza el mínimo de compra.
 *
 * @param quantity Cantidad pedida.
 * @param minimumQuantity Mínimo de compra.
 * @return Verdadero si la cantidad es menor que el mínimo.
 */
export const isBelowMinimum = (quantity: number, minimumQuantity: number): boolean =>
    quantity < minimumQuantity;
