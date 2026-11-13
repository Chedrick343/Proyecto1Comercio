/**
 * @fileoverview Tarjeta de producto del catálogo.
 */

import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import AddToCartControl from '../add-to-cart/AddToCartControl';
import ProductPrice from '../product-price/ProductPrice';
import { getMainCategory, type Product } from '../../utils/Products';
import { getCatalogReturnState } from '../../catalog/catalogReturn';

import styles from './ProductsGrid.module.css';

/** Disposición de la tarjeta: en cuadrícula o en lista. */
export type ProductCardLayout = 'grid' | 'list';

/** Propiedades de ProductCard. */
interface ProductCardProps {
    product: Product;
    layout: ProductCardLayout;
}

/**
 * Muestra un producto con su imagen, precio y control para agregarlo al
 * carrito. Toda la tarjeta enlaza al detalle del producto.
 *
 * @param props Propiedades del componente.
 * @return La tarjeta del producto.
 */
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
                    {getMainCategory(product) ??t('product.uncategorized')}
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
                    <ProductPrice product={product} priceClassName={styles.price} />

                    <AddToCartControl product={product} fullWidth={!isList} />
                </div>
            </div>
        </article>
    );
}
