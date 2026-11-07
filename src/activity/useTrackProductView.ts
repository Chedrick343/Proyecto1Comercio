/**
 * @fileoverview Hook que registra las visitas al detalle de un producto.
 */

import { useEffect, useRef } from 'react';

import { useAnalytics } from '../context/AnalyticsContext';
import type { Product } from '../utils/Products';
import { toProductSnapshot } from './eventPayloads';

/**
 * Registra un evento PRODUCT_VIEW cada vez que se muestra un producto
 * distinto. Volver a renderizar el mismo producto no lo registra de nuevo.
 *
 * @param product Producto mostrado, o null mientras carga o si no existe.
 */
export function useTrackProductView(product: Product | null) {
    const { track } = useAnalytics();
    const lastTrackedIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!product || lastTrackedIdRef.current === product.objectID) {
            return;
        }

        lastTrackedIdRef.current = product.objectID;
        track('PRODUCT_VIEW', toProductSnapshot(product));
    }, [product, track]);
}
