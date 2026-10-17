import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddToCartControl from '../add-to-cart/AddToCartControl';
import AddedToCartDialog from '../add-to-cart/AddedToCartDialog';
import { IVA_RATE } from '../../context/CartContext';
import { getAvailableStores, getStockStatus } from '../../product/productSpecifications';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';
import type { Product } from '../../utils/Products';
import StarRating from './StarRating';

import styles from './ProductDetailPage.module.css';

const STOCK_STATUS_CLASS = {
    available: styles.stockAvailable,
    lowStock: styles.stockLow,
    outOfStock: styles.stockOut
};

export default function ProductOverview({ product }: { product: Product }) {
    const { t } = useTranslation('product');
    const [isAddedDialogOpen, setIsAddedDialogOpen] = useState(false);

    const stockStatus = getStockStatus(product);
    const availableStores = getAvailableStores(product);

    return (
        <section className={styles.overview} aria-labelledby="product-title">
            <p className={styles.brand}>{product.brand}</p>
            <h1 id="product-title" className={styles.title}>{product.title}</h1>
            <StarRating rating={product.rating} />

            <div className={styles.priceBlock}>
                <p className={styles.price}>
                    {formatCurrency(product.b2c.price, product.b2c.currency)}
                </p>
                <p className={styles.priceNote}>
                    {t('priceNote', { rate: formatRate(IVA_RATE) })}
                </p>
            </div>

            <p className={styles.availability}>
                <span className={`${styles.stockStatus} ${STOCK_STATUS_CLASS[stockStatus]}`}>
                    {t(`stock.${stockStatus}`, { count: product.stock_quantity })}
                </span>
                {stockStatus !== 'outOfStock' && availableStores.length > 0 && (
                    <span className={styles.stores}>
                        {t('stores', { stores: availableStores.join(' · ') })}
                    </span>
                )}
            </p>

            <AddToCartControl
                product={product}
                fullWidth
                className={styles.purchase}
                onAdded={() => setIsAddedDialogOpen(true)}
            />

            <AddedToCartDialog
                product={product}
                isOpen={isAddedDialogOpen}
                onClose={() => setIsAddedDialogOpen(false)}
            />

            {product.description && (
                <div className={styles.description}>
                    <h2>{t('description')}</h2>
                    <p>{product.description}</p>
                </div>
            )}

            {product.sku && (
                <p className={styles.reference}>{t('reference', { sku: product.sku })}</p>
            )}
        </section>
    );
}
