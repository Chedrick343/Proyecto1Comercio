/**
 * @fileoverview Disponibilidad de los productos del carrito en una sucursal:
 * qué se puede comprar completo, qué solo en parte y qué no hay, además de la
 * sucursal que mejor cubre el pedido.
 */

import type { CartItem } from '../context/CartContext';
import type { Product } from '../utils/Products';
import { getBranchStock } from './branchInventory';
import { BRANCHES, type Branch } from './branches';

/**
 * Disponibilidad de una línea del carrito en una sucursal: completa, solo
 * parte de las unidades, ninguna, o desconocida si no se pudo consultar.
 */
export type LineAvailability = 'ENOUGH' | 'PARTIAL' | 'NONE' | 'UNKNOWN';

/** Línea del carrito con su disponibilidad en una sucursal. */
export interface CartLineAtBranch {
    item: CartItem;
    /** Unidades del producto que hay en la sucursal. */
    availableUnits: number;
    availability: LineAvailability;
}

/** Sucursal que más líneas del carrito puede atender completas. */
export interface BranchSuggestion {
    branch: Branch;
    /** Cantidad de líneas que la sucursal tiene completas. */
    coveredLines: number;
    /** Indica si la sucursal tiene todo el pedido. */
    coversWholeCart: boolean;
}

/**
 * Calcula la disponibilidad de cada línea del carrito en una sucursal.
 *
 * @param cart Productos del carrito.
 * @param productsById Inventario consultado de cada producto.
 * @param branchId Sucursal a revisar.
 * @return Las líneas del carrito con sus unidades disponibles.
 */
export function getCartLinesAtBranch(
    cart: CartItem[],
    productsById: Record<string, Product>,
    branchId: string
): CartLineAtBranch[] {
    return cart.map((item) => {
        const product = productsById[item.id];

        if (!product) {
            return { item, availableUnits: 0, availability: 'UNKNOWN' };
        }

        const availableUnits = getBranchStock(product, branchId);
        let availability: LineAvailability = 'ENOUGH';

        if (availableUnits === 0) {
            availability = 'NONE';
        } else if (availableUnits < item.quantity) {
            availability = 'PARTIAL';
        }

        return { item, availableUnits, availability };
    });
}

/**
 * Indica si todas las líneas se pueden comprar completas.
 *
 * @param lines Líneas del carrito en una sucursal.
 * @return Verdadero si hay unidades suficientes de todo.
 */
export const isWholeCartAvailable = (lines: CartLineAtBranch[]): boolean =>
    lines.every((line) => line.availability === 'ENOUGH');

/**
 * Obtiene lo que sí se puede comprar en la sucursal: cada producto con las
 * unidades disponibles, sin pasarse de las que hay en el carrito.
 *
 * @param lines Líneas del carrito en una sucursal.
 * @return Los productos con la cantidad que se puede comprar.
 */
export function getPurchasableItems(lines: CartLineAtBranch[]): CartItem[] {
    return lines
        .map((line) => ({
            ...line.item,
            quantity: Math.min(line.item.quantity, line.availableUnits)
        }))
        .filter((item) => item.quantity > 0);
}

/**
 * Busca la sucursal que tiene completas más líneas del carrito. Si hay un
 * empate, gana la que aparece primero en BRANCHES.
 *
 * @param cart Productos del carrito.
 * @param productsById Inventario consultado de cada producto.
 * @return La mejor sucursal, o null si el carrito está vacío.
 */
export function findBestBranch(
    cart: CartItem[],
    productsById: Record<string, Product>
): BranchSuggestion | null {
    if (cart.length === 0) {
        return null;
    }

    let bestSuggestion: BranchSuggestion | null = null;

    BRANCHES.forEach((branch) => {
        const coveredLines = getCartLinesAtBranch(cart, productsById, branch.id)
            .filter((line) => line.availability === 'ENOUGH')
            .length;

        if (!bestSuggestion || coveredLines > bestSuggestion.coveredLines) {
            bestSuggestion = {
                branch,
                coveredLines,
                coversWholeCart: coveredLines === cart.length
            };
        }
    });

    return bestSuggestion;
}
