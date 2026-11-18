/**
 * @fileoverview Hooks que calculan la disponibilidad de cada sucursal para
 * mostrarla en el diálogo de sucursales: de un producto o de todo el carrito.
 */

import { useTranslation } from 'react-i18next';

import type { CartItem } from '../../context/CartContext';
import { getStockByBranch } from '../../inventory/branchInventory';
import { BRANCHES } from '../../inventory/branches';
import { getCartLinesAtBranch } from '../../inventory/cartAvailability';
import { useCartInventory } from '../../inventory/useCartInventory';
import { getStockStatusForUnits } from '../../product/productSpecifications';
import type { Product } from '../../utils/Products';
import type { BranchStatus } from './BranchPickerDialog';

/**
 * Calcula las unidades de un producto en cada sucursal.
 *
 * @param product Producto a consultar.
 * @return La disponibilidad de cada sucursal, con etiquetas como "Quedan 3".
 */
export function useProductBranchStatuses(product: Product): BranchStatus[] {
    const { t } = useTranslation('common');

    return getStockByBranch(product).map(({ branch, stock }) => {
        const status = getStockStatusForUnits(stock);

        return {
            branch,
            status,
            label: t(`branch.stockTag.${status}`, { count: stock })
        };
    });
}

/**
 * Consulta el inventario de los productos del carrito y calcula cuántos de
 * ellos tiene completos cada sucursal (con todas las unidades pedidas).
 *
 * @param cart Productos del carrito.
 * @return La disponibilidad de cada sucursal, con etiquetas como "2 de 3
 *     productos" (vacía si tiene todo), y el inventario consultado para
 *     revisar cada producto.
 */
export function useCartBranchStatuses(cart: CartItem[]) {
    const { t } = useTranslation('common');
    const inventory = useCartInventory(cart.map((item) => item.id));

    const statuses: BranchStatus[] = BRANCHES.map((branch) => {
        if (inventory.isLoading) {
            return { branch, status: 'unknown', label: t('branch.loadingStock') };
        }

        const availableItems = getCartLinesAtBranch(cart, inventory.productsById, branch.id)
            .filter((line) => line.availability === 'ENOUGH')
            .length;

        // Si todo está disponible no hace falta etiqueta; solo se señalan los problemas.
        if (availableItems === cart.length) {
            return { branch, status: 'available', label: '' };
        }

        if (availableItems === 0) {
            return { branch, status: 'outOfStock', label: t('branch.cartTag.none') };
        }

        return {
            branch,
            status: 'lowStock',
            label: t('branch.cartTag.some', { available: availableItems, total: cart.length })
        };
    });

    return { statuses, inventory };
}
