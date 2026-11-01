/**
 * @fileoverview Contexto para abrir y cerrar la vista previa del carrito.
 */

import { createContext, useContext } from 'react';

/**
 * Páginas que ya muestran el carrito, donde los botones del carrito
 * enlazan a él en lugar de abrir la vista previa.
 */
const PAGES_WITHOUT_CART_PREVIEW = ['/carrito', '/checkout'];

/**
 * Indica si la vista previa del carrito puede abrirse en una ruta.
 *
 * @param pathname Ruta actual.
 * @return Falso en las páginas del carrito y del checkout.
 */
export const isCartPreviewAvailable = (pathname: string): boolean =>
    !PAGES_WITHOUT_CART_PREVIEW.some((page) => pathname.startsWith(page));

/** Valor que expone el contexto de la vista previa. */
interface CartPreviewContextValue {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

/** Contexto de la vista previa; es undefined fuera de su proveedor. */
export const CartPreviewContext = createContext<CartPreviewContextValue | undefined>(undefined);

/**
 * Da acceso al estado de la vista previa del carrito.
 *
 * @return El estado de apertura y las funciones para abrir y cerrar.
 * @throws {Error} Si se usa fuera de CartPreviewProvider.
 */
export function useCartPreview(): CartPreviewContextValue {
    const context = useContext(CartPreviewContext);

    if (!context) {
        throw new Error('useCartPreview debe utilizarse dentro de CartPreviewProvider');
    }

    return context;
}
