import { createContext, useContext } from 'react';

// On these pages the cart is already on screen, so cart buttons just link to it.
const PAGES_WITHOUT_CART_PREVIEW = ['/carrito', '/checkout'];

export const isCartPreviewAvailable = (pathname: string): boolean =>
    !PAGES_WITHOUT_CART_PREVIEW.some((page) => pathname.startsWith(page));

interface CartPreviewContextValue {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

export const CartPreviewContext = createContext<CartPreviewContextValue | undefined>(undefined);

export function useCartPreview(): CartPreviewContextValue {
    const context = useContext(CartPreviewContext);

    if (!context) {
        throw new Error('useCartPreview debe utilizarse dentro de CartPreviewProvider');
    }

    return context;
}
