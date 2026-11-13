/**
 * @fileoverview Resumen principal del producto: precio, disponibilidad y compra.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStore } from 'react-icons/fa';

import AddToCartControl from '../add-to-cart/AddToCartControl';
import BranchPickerDialog from '../branch-picker/BranchPickerDialog';
import DefaultBranchStockNote from '../branch-picker/DefaultBranchStockNote';
import { useProductBranchStatuses } from '../branch-picker/useBranchStatuses';
import ProductPrice from '../product-price/ProductPrice';
import { IVA_RATE } from '../../context/CartContext';
import { getStockStatus } from '../../product/productSpecifications';
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
 * Muestra marca, nombre, calificación, precio y disponibilidad, junto con el
 * control para agregar al carrito. Cualquier persona puede consultar las
 * unidades en cada sucursal; la sucursal de la compra se elige en el
 * checkout. Si el usuario tiene una sucursal predeterminada, también se
 * indica cuántas unidades hay en ella.
 *
 * @param props Propiedades del componente.
 * @param props.product Producto a mostrar.
 * @return El resumen del producto.
 */
export default function ProductOverview({ product }: { product: Product }) {
    const { t } = useTranslation(['product', 'common']);
    const [isBranchStockOpen, setIsBranchStockOpen] = useState(false);

    const stockStatus = getStockStatus(product);
    const branchStatuses = useProductBranchStatuses(product);

    /** Abre la consulta de unidades por sucursal y la registra en la consola. */
    const handleOpenBranchStock = () => {
        console.log(`Consultando disponibilidad por sucursal de ${product.objectID}:`, branchStatuses);
        setIsBranchStockOpen(true);
    };

    return (
        <section className={styles.overview} aria-labelledby="product-title">
            <p className={styles.brand}>{product.brand}</p>
            <h1 id="product-title" className={styles.title}>{product.title}</h1>
            <StarRating rating={product.rating} />

            <div className={styles.priceBlock}>
                <ProductPrice product={product} priceClassName={styles.price} showSavings />
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
                    {t('common:branch.viewAvailability')}
                </button>
            </div>

            <DefaultBranchStockNote product={product} />

            <BranchPickerDialog
                isOpen={isBranchStockOpen}
                onClose={() => setIsBranchStockOpen(false)}
                description={t('common:branch.dialog.productDescription', { name: product.title })}
                statuses={branchStatuses}
                isSelectable={false}
                footnote={t('common:branch.dialog.total', { count: product.stock_quantity })}
            />

            <AddToCartControl
                product={product}
                fullWidth
                className={styles.purchase}
                confirmWithDialog
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
