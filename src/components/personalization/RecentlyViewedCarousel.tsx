/**
 * @fileoverview Carrusel de los productos vistos recientemente.
 */

import { useTranslation } from 'react-i18next';

import { useUserHistory } from '../../activity/useUserHistory';
import ProductCarousel from './ProductCarousel';

/** Propiedades de RecentlyViewedCarousel. */
interface RecentlyViewedCarouselProps {
    /** Producto que se está viendo, si hay; se omite de la lista. */
    currentProductId?: string;
    /** Clase adicional de la sección. */
    className?: string;
}

/**
 * Muestra los productos que el usuario vio hace poco, para que pueda volver
 * a ellos sin buscarlos de nuevo.
 *
 * @param props Propiedades del componente.
 * @return El carrusel, o null si no hay otros productos vistos.
 */
export default function RecentlyViewedCarousel({
    currentProductId,
    className
}: RecentlyViewedCarouselProps) {
    const { t } = useTranslation('catalog');
    const { recentlyViewedProducts } = useUserHistory();

    const otherProducts = recentlyViewedProducts.filter(
        (product) => product.productId !== currentProductId
    );

    return (
        <ProductCarousel
            title={t('personalization.recentlyViewed')}
            products={otherProducts}
            className={className}
        />
    );
}
