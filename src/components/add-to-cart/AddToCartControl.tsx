/**
 * @fileoverview Botón para agregar un producto al carrito y ajustar su cantidad.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBan, FaCartPlus, FaLock } from 'react-icons/fa';

import { toProductSnapshot } from '../../activity/eventPayloads';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useCart } from '../../context/CartContext';
import { useSession } from '../../context/SessionContext';
import { getMinimumQuantity } from '../../pricing/businessMinimum';
import { getCustomerPrice } from '../../pricing/customerPrice';
import { hasPermission } from '../../session/permissions';
import type { Product } from '../../utils/Products';
import AddedToCartDialog from './AddedToCartDialog';
import QuantityStepper from './QuantityStepper';

import styles from './AddToCartControl.module.css';

/** Propiedades de AddToCartControl. */
interface AddToCartControlProps {
    /** Producto a agregar. */
    product: Product;
    /** Ocupa todo el ancho disponible. */
    fullWidth?: boolean;
    /** Clase adicional del contenedor. */
    className?: string;
    /**
     * Al agregar el producto por primera vez, muestra una confirmación con el
     * mismo selector de cantidad, para agregar más unidades sin cerrarla.
     */
    confirmWithDialog?: boolean;
}

/**
 * Muestra un botón para agregar el producto. Tras agregarlo, se convierte
 * en un selector de cantidad limitado por el stock total de todas las
 * sucursales; la disponibilidad en la sucursal elegida se valida en el
 * checkout. Para un cliente B2B, el botón agrega de una vez el mínimo de
 * compra del producto, y bajar de ese mínimo lo quita del carrito. Los
 * cambios se anuncian a los lectores de pantalla. Quien no
 * puede comprar, como el administrador, ve un aviso en lugar del botón, igual
 * que cuando el producto no tiene un precio válido para el usuario.
 *
 * @param props Propiedades del componente.
 * @return El control para agregar al carrito.
 */
export default function AddToCartControl({
    product,
    fullWidth = false,
    className,
    confirmWithDialog = false
}: AddToCartControlProps) {
    const { t } = useTranslation('product');
    const {
        cart,
        priceTier,
        addProduct,
        increaseQuantity,
        decreaseQuantity,
        removeProduct
    } = useCart();
    const { track } = useAnalytics();
    const { currentUser } = useSession();
    const [isAddedDialogOpen, setIsAddedDialogOpen] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    // Counts only the units added during this visit; reloading or navigating resets it,
    // while the cart keeps its full quantity.
    const [addedInThisVisit, setAddedInThisVisit] = useState(0);

    const productId = String(product.objectID);
    const quantityInCart = cart.find((item) => item.id === productId)?.quantity ?? 0;
    // Never shows more than the cart has, in case it was changed elsewhere.
    const displayedQuantity = Math.min(addedInThisVisit, quantityInCart);
    const showStepper = displayedQuantity > 0;
    // Para empresas es el mínimo B2B del producto; para los demás, 1.
    const minimumQuantity = getMinimumQuantity(product, priceTier);
    // Bajar del mínimo deja una cantidad inválida, así que en ese punto se quita el producto.
    const removesProduct = quantityInCart <= minimumQuantity;
    const isOutOfStock = !product.in_stock;
    const lacksStockForMinimum = !isOutOfStock && product.stock_quantity < minimumQuantity;
    const hasReachedStock = quantityInCart >= product.stock_quantity;
    const hasPriceProblem = getCustomerPrice(product, priceTier).problem !== null;
    const name = product.title;

    const containerClassName = [fullWidth && styles.fullWidth, className]
        .filter(Boolean)
        .join(' ');

    /**
     * Registra que se agregaron unidades del producto al carrito.
     *
     * @param quantity Unidades agregadas.
     */
    const trackUnitsAdded = (quantity: number) =>
        track('ADD_TO_CART', { ...toProductSnapshot(product), quantity });

    /** Agrega el producto con la cantidad mínima que le corresponde al usuario. */
    const handleAdd = () => {
        if (minimumQuantity > 1) {
            console.log(`Se agrega ${productId} con el mínimo B2B de ${minimumQuantity} unidades.`);
        }

        addProduct(product, minimumQuantity);
        trackUnitsAdded(minimumQuantity);
        setAddedInThisVisit(minimumQuantity);
        setAnnouncement(t('addedAnnouncement', { name }));

        if (confirmWithDialog) {
            setIsAddedDialogOpen(true);
        }
    };

    /** Suma una unidad del producto en el carrito. */
    const handleIncrease = () => {
        increaseQuantity(productId);
        trackUnitsAdded(1);
        setAddedInThisVisit(displayedQuantity + 1);
    };

    /** Resta una unidad; si ya está en el mínimo, quita el producto del carrito. */
    const handleDecrease = () => {
        if (removesProduct) {
            setAddedInThisVisit(0);
            removeProduct(productId);
            setAnnouncement(t('cartControl.removedAnnouncement', { name }));
            return;
        }

        setAddedInThisVisit(displayedQuantity - 1);
        decreaseQuantity(productId);
    };

    // El mismo selector se muestra en la página y en la confirmación, así que siempre coinciden.
    const stepper = (
        <QuantityStepper
            name={name}
            quantity={displayedQuantity}
            removesProduct={removesProduct}
            canIncrease={!hasReachedStock}
            onDecrease={handleDecrease}
            onIncrease={handleIncrease}
        />
    );

    if (!hasPermission(currentUser, 'ADD_TO_CART')) {
        return (
            <div className={containerClassName}>
                <p className={styles.purchaseDisabledNote}>
                    <FaLock aria-hidden="true" />
                    <span>{t('purchaseDisabled')}</span>
                </p>
            </div>
        );
    }

    if (hasPriceProblem) {
        return (
            <div className={containerClassName}>
                <p className={styles.purchaseDisabledNote}>
                    <FaBan aria-hidden="true" />
                    <span>{t('priceUnavailable')}</span>
                </p>
            </div>
        );
    }

    return (
        <div className={containerClassName}>
            {!showStepper ? (
                <button
                    type="button"
                    className={styles.addButton}
                    onClick={handleAdd}
                    disabled={isOutOfStock || lacksStockForMinimum}
                >
                    <FaCartPlus aria-hidden="true" />
                    {isOutOfStock && <span>{t('outOfStock')}</span>}
                    {lacksStockForMinimum && (
                        <span>{t('notEnoughForMinimum', { count: minimumQuantity })}</span>
                    )}
                    {!isOutOfStock && !lacksStockForMinimum && minimumQuantity === 1 && (
                        <>
                            <span className={styles.longLabel}>{t('addToCart')}</span>
                            <span className={styles.shortLabel}>{t('addToCartShort')}</span>
                        </>
                    )}
                    {!isOutOfStock && !lacksStockForMinimum && minimumQuantity > 1 && (
                        <>
                            <span className={styles.longLabel}>
                                {t('addMinimum', { count: minimumQuantity })}
                            </span>
                            <span className={styles.shortLabel}>
                                {t('addMinimumShort', { count: minimumQuantity })}
                            </span>
                        </>
                    )}
                </button>
            ) : (
                stepper
            )}

            <span className={styles.srOnly} role="status">{announcement}</span>

            {confirmWithDialog && (
                <AddedToCartDialog
                    product={product}
                    isOpen={isAddedDialogOpen && showStepper}
                    onClose={() => setIsAddedDialogOpen(false)}
                >
                    {stepper}
                </AddedToCartDialog>
            )}
        </div>
    );
}
