/**
 * @fileoverview Consultas sobre el inventario de un producto en cada sucursal.
 * El inventario por sucursal (locations) es la fuente de verdad; el stock
 * total siempre se calcula a partir de él.
 */

import type { Location, Product } from '../utils/Products';
import { BRANCHES, type Branch } from './branches';

/** Unidades de un producto en una sucursal. */
export interface BranchStock {
    branch: Branch;
    stock: number;
}

/**
 * Busca el inventario de un producto en una sucursal.
 *
 * @param product Producto a consultar.
 * @param branchId Identificador de la sucursal.
 * @return El registro de esa sucursal, o undefined si el producto no lo tiene.
 */
const findLocation = (product: Product, branchId: string): Location | undefined =>
    product.locations.find((location) => location.locationId === branchId);

/**
 * Obtiene las unidades de un producto en una sucursal. Una sucursal sin
 * registro, o marcada como no disponible, cuenta como 0 unidades.
 *
 * @param product Producto a consultar.
 * @param branchId Identificador de la sucursal.
 * @return Las unidades disponibles en esa sucursal.
 */
export function getBranchStock(product: Product, branchId: string): number {
    const location = findLocation(product, branchId);

    if (!location || !location.available) {
        return 0;
    }

    return Math.max(0, location.stock);
}

/**
 * Indica si un producto tiene unidades en una sucursal.
 *
 * @param product Producto a consultar.
 * @param branchId Identificador de la sucursal.
 * @return Verdadero si hay al menos una unidad.
 */
export const isAvailableAtBranch = (product: Product, branchId: string): boolean =>
    getBranchStock(product, branchId) > 0;

/**
 * Obtiene las unidades de un producto en cada sucursal de la tienda,
 * incluidas las que no tienen unidades.
 *
 * @param product Producto a consultar.
 * @return Las unidades por sucursal, en el orden de BRANCHES.
 */
export const getStockByBranch = (product: Product): BranchStock[] =>
    BRANCHES.map((branch) => ({
        branch,
        stock: getBranchStock(product, branch.id)
    }));

/**
 * Suma las unidades de un inventario por sucursal.
 *
 * @param locations Inventario por sucursal.
 * @return El total de unidades disponibles.
 */
export const sumLocationsStock = (locations: Location[]): number =>
    locations.reduce(
        (total, location) => total + (location.available ? Math.max(0, location.stock) : 0),
        0
    );
