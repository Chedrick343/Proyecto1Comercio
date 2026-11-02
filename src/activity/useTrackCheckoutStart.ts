/**
 * @fileoverview Hook que registra la entrada al checkout.
 */

import { useEffect, useRef } from 'react';

import { useAnalytics } from '../context/AnalyticsContext';
import type { CartItem } from '../context/CartContext';
import { toCheckoutStartPayload } from './eventPayloads';

/**
 * Registra un evento CHECKOUT_START una sola vez por visita al checkout, con
 * el carrito que había al entrar. No registra nada si el carrito está vacío,
 * porque en ese caso el checkout redirige al carrito.
 *
 * @param cart Productos del carrito.
 * @param total Total a pagar, con impuestos y envío.
 */
export function useTrackCheckoutStart(cart: CartItem[], total: number) {
    const { track } = useAnalytics();
    const hasTrackedRef = useRef(false);

    useEffect(() => {
        if (hasTrackedRef.current || cart.length === 0) {
            return;
        }

        hasTrackedRef.current = true;
        track('CHECKOUT_START', toCheckoutStartPayload(cart, total));
    }, [cart, total, track]);
}
