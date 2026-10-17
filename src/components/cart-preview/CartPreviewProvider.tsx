import { useMemo, useState, type ReactNode } from 'react';

import CartPreview from './CartPreview';
import { CartPreviewContext } from './cartPreviewContext';

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
