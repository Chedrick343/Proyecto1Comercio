import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCartPlus, FaMinus, FaPlus, FaTrash } from 'react-icons/fa';

import { useCart } from '../../context/CartContext';
import type { Product } from '../../utils/Products';

import styles from './AddToCartControl.module.css';

interface AddToCartControlProps {
    product: Product;
    fullWidth?: boolean;
    className?: string;
    onAdded?: () => void;
}

export default function AddToCartControl({
    product,
    fullWidth = false,
    className,
    onAdded
}: AddToCartControlProps) {
    const { t } = useTranslation('product');
    const { cart, addProduct, increaseQuantity, decreaseQuantity, removeProduct } = useCart();
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

    const handleAdd = () => {
        addProduct(product, 1);
        setAddedInThisVisit(1);
        setAnnouncement(t('addedAnnouncement', { name }));
        onAdded?.();
    };

    const handleIncrease = () => {
        increaseQuantity(productId);
        setAddedInThisVisit(displayedQuantity + 1);
    };

    const handleDecrease = () => {
        setAddedInThisVisit(displayedQuantity - 1);

        if (removesProduct) {
            removeProduct(productId);
            setAnnouncement(t('cartControl.removedAnnouncement', { name }));
            return;
        }

        decreaseQuantity(productId);
    };

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
                <div
                    className={styles.stepper}
                    role="group"
                    aria-label={t('cartControl.label', { name })}
                >
                    <button
                        type="button"
                        className={styles.stepButton}
                        onClick={handleDecrease}
                        aria-label={
                            removesProduct
                                ? t('cartControl.remove', { name })
                                : t('cartControl.decrease', { name })
                        }
                    >
                        {displayedQuantity === 1
                            ? <FaTrash aria-hidden="true" />
                            : <FaMinus aria-hidden="true" />}
                    </button>

                    <span className={styles.quantity} aria-live="polite">
                        <strong>{displayedQuantity}</strong>{' '}
                        <span className={styles.inCartLabel}>{t('cartControl.inCart')}</span>
                    </span>

                    <button
                        type="button"
                        className={styles.stepButton}
                        onClick={handleIncrease}
                        disabled={hasReachedStock}
                        aria-label={t('cartControl.increase', { name })}
                    >
                        <FaPlus aria-hidden="true" />
                    </button>
                </div>
            )}

            <span className={styles.srOnly} role="status">{announcement}</span>
        </div>
    );
}
