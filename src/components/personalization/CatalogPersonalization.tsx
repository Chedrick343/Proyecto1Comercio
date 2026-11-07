/**
 * @fileoverview Secciones personalizadas al final del catálogo.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { toProductSnapshot } from '../../activity/eventPayloads';
import { useRecommendations } from '../../activity/useRecommendations';
import type { Product } from '../../utils/Products';
import ProductCarousel from './ProductCarousel';
import RecentlyViewedCarousel from './RecentlyViewedCarousel';

import styles from './CatalogPersonalization.module.css';

/** Propiedades de CatalogPersonalization. */
interface CatalogPersonalizationProps {
    /** Productos del catálogo, de los que se eligen las recomendaciones. */
    catalog: Product[];
    /**
     * Indica si se muestran recomendaciones. Solo tienen sentido con el
     * catálogo completo, no con los resultados de una búsqueda.
     */
    showRecommendations: boolean;
}

/**
 * Muestra los productos recomendados y los vistos recientemente por quien
 * está usando la tienda. Cada carrusel aparece solo si hay datos de su
 * actividad, así que un visitante nuevo no ve ninguno.
 *
 * @param props Propiedades del componente.
 * @return Las secciones personalizadas.
 */
export default function CatalogPersonalization({
    catalog,
    showRecommendations
}: CatalogPersonalizationProps) {
    const { t } = useTranslation('catalog');
    const { recommendedProducts, basedOnCategories } = useRecommendations(catalog);

    const recommendedSnapshots = useMemo(
        () => (showRecommendations ? recommendedProducts.map(toProductSnapshot) : []),
        [showRecommendations, recommendedProducts]
    );

    return (
        <div className={styles.personalization}>
            <ProductCarousel
                title={t('personalization.recommended.title')}
                description={t('personalization.recommended.basedOn', {
                    categories: basedOnCategories.join(', ')
                })}
                products={recommendedSnapshots}
            />

            <RecentlyViewedCarousel />
        </div>
    );
}
