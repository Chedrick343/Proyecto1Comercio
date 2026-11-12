/**
 * @fileoverview Botón para agregar un producto al carrito y ajustar su cantidad.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCartPlus, FaLock } from 'react-icons/fa';

import { toProductSnapshot } from '../../activity/eventPayloads';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useCart } from '../../context/CartContext';
import { useSession } from '../../context/SessionContext';
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
 * checkout. Los cambios se anuncian a los lectores de pantalla. Quien no
 * puede comprar, como el administrador, ve un aviso en lugar del botón.
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
    const { cart, addProduct, increaseQuantity, decreaseQuantity, removeProduct } = useCart();
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
    const removesProduct = quantityInCart === 1;
    const isOutOfStock = !product.in_stock;
    const hasReachedStock = quantityInCart >= product.stock_quantity;
    const name = product.title;

    const containerClassName = [fullWidth && styles.fullWidth, className]
        .filter(Boolean)
        .join(' ');

    /** Registra que se agregó una unidad del producto al carrito. */
    const trackUnitAdded = () =>
        track('ADD_TO_CART', { ...toProductSnapshot(product), quantity: 1 });

    /** Agrega la primera unidad del producto al carrito. */
    const handleAdd = () => {
        addProduct(product, 1);
        trackUnitAdded();
        setAddedInThisVisit(1);
        setAnnouncement(t('addedAnnouncement', { name }));

        if (confirmWithDialog) {
            setIsAddedDialogOpen(true);
        }
    };

    /** Suma una unidad del producto en el carrito. */
    const handleIncrease = () => {
        increaseQuantity(productId);
        trackUnitAdded();
        setAddedInThisVisit(displayedQuantity + 1);
    };

    /** Resta una unidad; si era la última, quita el producto del carrito. */
    const handleDecrease = () => {
        setAddedInThisVisit(displayedQuantity - 1);

        if (removesProduct) {
            removeProduct(productId);
            setAnnouncement(t('cartControl.removedAnnouncement', { name }));
            return;
        }

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

    return (
        <div className={containerClassName}>
            {!showStepper ? (
                <button
                    type="button"
                    className={styles.addButton}
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                >
                    <FaCartPlus aria-hidden="true" />
                    {isOutOfStock ? (
                        <span>{t('outOfStock')}</span>
                    ) : (
                        <>
                            <span className={styles.longLabel}>{t('addToCart')}</span>
                            <span className={styles.shortLabel}>{t('addToCartShort')}</span>
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
