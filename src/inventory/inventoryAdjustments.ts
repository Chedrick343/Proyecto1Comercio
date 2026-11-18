/**
 * @fileoverview Inventario simulado. El índice de productos de Algolia no se
 * modifica desde el navegador; en su lugar, cada cambio de inventario (por
 * ejemplo, una compra confirmada) se guarda en localStorage como un ajuste de
 * unidades por producto y sucursal, y se aplica sobre los productos al
 * leerlos de Algolia.
 */

import type { Order } from '../orders/orderTypes';
import type { Location } from '../utils/Products';

/** Clave de localStorage donde se guardan los ajustes de inventario. */
const INVENTORY_ADJUSTMENTS_STORAGE_KEY = 'inventory-adjustments-v1';

/**
 * Ajustes de inventario: por cada producto, las unidades que se suman (o se
 * restan, si son negativas) en cada sucursal.
 */
type InventoryAdjustments = Record<string, Record<string, number>>;

/** Producto y cantidad que cambian en una sucursal. */
export interface StockChange {
    productId: string;
    branchId: string;
    /** Unidades a sumar; negativo para restar. */
    units: number;
}

/**
 * Ajustes ya leídos de localStorage. Se guardan en memoria para no leer y
 * convertir el JSON cada vez que se normaliza un producto del catálogo.
 */
let cachedAdjustments: InventoryAdjustments | null = null;

/**
 * Verifica que un valor recuperado tenga la forma de los ajustes.
 *
 * @param value Valor a verificar.
 * @return Verdadero si es un objeto de productos con unidades numéricas.
 */
function isInventoryAdjustments(value: unknown): value is InventoryAdjustments {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    return Object.values(value).every(
        (branches) =>
            typeof branches === 'object' &&
            branches !== null &&
            Object.values(branches).every((units) => typeof units === 'number')
    );
}

/**
 * Obtiene los ajustes de inventario guardados.
 *
 * @return Los ajustes, o un objeto vacío si no hay o están dañados.
 */
function getInventoryAdjustments(): InventoryAdjustments {
    if (cachedAdjustments) {
        return cachedAdjustments;
    }

    try {
        const storedAdjustments = localStorage.getItem(INVENTORY_ADJUSTMENTS_STORAGE_KEY);
        const parsedAdjustments: unknown = storedAdjustments ? JSON.parse(storedAdjustments) : {};

        cachedAdjustments = isInventoryAdjustments(parsedAdjustments) ? parsedAdjustments : {};
    } catch (error) {
        console.error('No se pudieron recuperar los ajustes de inventario:', error);
        cachedAdjustments = {};
    }

    return cachedAdjustments;
}

/**
 * Guarda los ajustes de inventario en localStorage y en memoria.
 *
 * @param adjustments Ajustes a guardar.
 */
function saveInventoryAdjustments(adjustments: InventoryAdjustments) {
    cachedAdjustments = adjustments;

    try {
        localStorage.setItem(INVENTORY_ADJUSTMENTS_STORAGE_KEY, JSON.stringify(adjustments));
    } catch (error) {
        console.error('No se pudieron guardar los ajustes de inventario:', error);
    }
}

/**
 * Registra cambios de inventario, sumándolos a los ajustes que ya existían.
 *
 * @param changes Cambios a registrar.
 */
export function recordStockChanges(changes: StockChange[]) {
    const adjustments = getInventoryAdjustments();
    const updatedAdjustments: InventoryAdjustments = { ...adjustments };

    changes.forEach(({ productId, branchId, units }) => {
        const productAdjustments = { ...(updatedAdjustments[productId] ?? {}) };
        productAdjustments[branchId] = (productAdjustments[branchId] ?? 0) + units;
        updatedAdjustments[productId] = productAdjustments;
    });

    console.log('Ajustes de inventario registrados:', changes);
    saveInventoryAdjustments(updatedAdjustments);
}

/**
 * Descuenta del inventario simulado las unidades de una orden confirmada, en
 * la sucursal desde la que se retira o despacha.
 *
 * @param order Orden confirmada.
 */
export function discountOrderInventory(order: Order) {
    if (!order.branch) {
        console.error(`La orden ${order.orderNumber} no tiene sucursal; no se descuenta inventario.`);
        return;
    }

    const branchId = order.branch.id;

    console.log(`Descontando el inventario de la orden ${order.orderNumber} en ${order.branch.name}.`);
    recordStockChanges(
        order.items.map((item) => ({ productId: item.productId, branchId, units: -item.quantity }))
    );
}

/**
 * Aplica los ajustes guardados al inventario por sucursal de un producto. El
 * stock nunca queda negativo, y una sucursal queda disponible solo si tiene
 * unidades.
 *
 * @param productId Identificador del producto.
 * @param locations Inventario por sucursal tal como viene de Algolia.
 * @return El inventario por sucursal con los ajustes aplicados.
 */
export function applyInventoryAdjustments(productId: string, locations: Location[]): Location[] {
    const productAdjustments = getInventoryAdjustments()[productId];

    if (!productAdjustments) {
        return locations;
    }

    return locations.map((location) => {
        const units = productAdjustments[location.locationId] ?? 0;

        if (units === 0) {
            return location;
        }

        const stock = Math.max(0, location.stock + units);
        return { ...location, stock, available: stock > 0 };
    });
}
