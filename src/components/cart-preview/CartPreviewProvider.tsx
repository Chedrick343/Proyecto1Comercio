/**
 * @fileoverview Proveedor del panel de vista previa del carrito.
 */

import { useMemo, useState, type ReactNode } from 'react';

import CartPreview from './CartPreview';
import { CartPreviewContext } from './cartPreviewContext';

/**
 * Controla la apertura del panel de vista previa del carrito y lo renderiza
 * una sola vez para toda la aplicación.
 *
 * @param props Propiedades del componente.
 * @param props.children Componentes que pueden abrir o cerrar el panel.
 * @return El proveedor del contexto junto con el panel.
 */
export default function CartPreviewProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const value = useMemo(() => ({
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false)
    }), [isOpen]);

    return (
        <CartPreviewContext.Provider value={value}>
            {children}
            <CartPreview isOpen={isOpen} onClose={value.close} />
        </CartPreviewContext.Provider>
    );
}
