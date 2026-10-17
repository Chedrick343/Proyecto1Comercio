import { useTranslation } from 'react-i18next';

import ProductCard from '../Products/ProductCard';
import type { Product } from '../../utils/Products';
import { useRelatedProducts } from './useRelatedProducts';

import styles from './ProductDetailPage.module.css';

export default function RelatedProducts({ product }: { product: Product }) {
    const { t } = useTranslation('product');
    const relatedProducts = useRelatedProducts(product);

    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <section className={styles.relatedSection} aria-labelledby="related-products-heading">
            <h2 id="related-products-heading" className={styles.sectionTitle}>
                {t('related.title', { brand: product.brand })}
            </h2>

            <div className={styles.relatedGrid}>
                {relatedProducts.map((relatedProduct) => (
                    <ProductCard
                        key={relatedProduct.objectID}
                        product={relatedProduct}
                        layout="grid"
                    />
                ))}
            </div>
        </section>
    );
}
