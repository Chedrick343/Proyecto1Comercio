import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AddToCartControl from '../add-to-cart/AddToCartControl';
import type { Product } from '../../utils/Products';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCatalogReturnState } from '../../catalog/catalogReturn';

import styles from './ProductsGrid.module.css';

export type ProductCardLayout = 'grid' | 'list';

const getMainCategory = (categories: string[]): string | undefined =>
    categories[categories.length - 1];

interface ProductCardProps {
    product: Product;
    layout: ProductCardLayout;
}

export default function ProductCard({ product, layout }: ProductCardProps) {
    const { t } = useTranslation('catalog');
    const location = useLocation();
    const isList = layout === 'list';

    return (
        <article className={isList ? `${styles.card} ${styles.listCard}` : styles.card}>
            <div className={isList ? styles.listImageWrapper : styles.imageWrapper}>
                <img
                    src={product.image_url}
                    alt=""
                    className={styles.image}
                    loading="lazy"
                />

                {!product.in_stock && (
                    <span className={styles.outOfStock}>{t('product.outOfStock')}</span>
                )}
            </div>

            <div className={styles.cardBody}>
                <span className={styles.category}>
                    {getMainCategory(product.categories) ?? t('product.uncategorized')}
                </span>

                <h3 className={styles.cardTitle}>
                    {/* The link stretches over the whole card (see .cardLink::after). */}
                    <Link
                        to={`/producto/${encodeURIComponent(product.objectID)}`}
                        state={getCatalogReturnState(location)}
                        className={styles.cardLink}
                    >
                        {product.title}
                    </Link>
                </h3>

                <div className={styles.cardFooter}>
                    <p className={styles.price}>
                        {formatCurrency(product.b2c.price, product.b2c.currency)}
                    </p>

                    <AddToCartControl product={product} fullWidth={!isList} />
                </div>
            </div>
        </article>
    );
}
