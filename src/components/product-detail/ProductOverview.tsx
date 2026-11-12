/**
 * @fileoverview Resumen principal del producto: precio, disponibilidad y compra.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStore } from 'react-icons/fa';

import AddToCartControl from '../add-to-cart/AddToCartControl';
import AddedToCartDialog from '../add-to-cart/AddedToCartDialog';
import BranchStockDialog from '../branch-stock/BranchStockDialog';
import { IVA_RATE } from '../../context/CartContext';
import { getStockByBranch } from '../../inventory/branchInventory';
import { getStockStatus } from '../../product/productSpecifications';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';
import type { Product } from '../../utils/Products';
import StarRating from './StarRating';

import styles from './ProductDetailPage.module.css';

/** Clase de estilo de cada nivel de disponibilidad. */
const STOCK_STATUS_CLASS = {
    available: styles.stockAvailable,
    lowStock: styles.stockLow,
    outOfStock: styles.stockOut
};

/**
 * Muestra marca, nombre, calificación, precio y disponibilidad, con un botón
 * para ver las unidades en cada sucursal y el control para agregar al carrito.
 *
 * @param props Propiedades del componente.
 * @param props.product Producto a mostrar.
 * @return El resumen del producto.
 */
export default function ProductOverview({ product }: { product: Product }) {
    const { t } = useTranslation('product');
    const [isAddedDialogOpen, setIsAddedDialogOpen] = useState(false);
    const [isBranchStockOpen, setIsBranchStockOpen] = useState(false);

    const stockStatus = getStockStatus(product);

    /** Abre la disponibilidad por sucursal y la registra en la consola. */
    const handleOpenBranchStock = () => {
        console.log(`Consultando disponibilidad por sucursal de ${product.objectID}:`, getStockByBranch(product));
        setIsBranchStockOpen(true);
    };

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

            <div className={styles.availability}>
                <span className={`${styles.stockStatus} ${STOCK_STATUS_CLASS[stockStatus]}`}>
                    {t(`stock.${stockStatus}`, { count: product.stock_quantity })}
                </span>
                <button
                    type="button"
                    className={styles.branchStockButton}
                    aria-haspopup="dialog"
                    onClick={handleOpenBranchStock}
                >
                    <FaStore aria-hidden="true" />
                    {t('branchStock.open')}
                </button>
            </div>

            <BranchStockDialog
                product={product}
                isOpen={isBranchStockOpen}
                onClose={() => setIsBranchStockOpen(false)}
            />

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
