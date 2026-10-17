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
}

export default function AddToCartControl({
    product,
    fullWidth = false,
    className
}: AddToCartControlProps) {
    const { t } = useTranslation('product');
    const { cart, addProduct, increaseQuantity, decreaseQuantity, removeProduct } = useCart();
    const [announcement, setAnnouncement] = useState('');
    // The stepper only appears after adding during this visit; reloading or navigating resets it.
    const [wasAddedInThisVisit, setWasAddedInThisVisit] = useState(false);

    const productId = String(product.objectID);
    const quantityInCart = cart.find((item) => item.id === productId)?.quantity ?? 0;
    const showStepper = wasAddedInThisVisit && quantityInCart > 0;
    const isOutOfStock = !product.in_stock;
    const hasReachedStock = quantityInCart >= product.stock_quantity;
    const name = product.title;

    const containerClassName = [fullWidth && styles.fullWidth, className]
        .filter(Boolean)
        .join(' ');

    const handleAdd = () => {
        addProduct(product, 1);
        setWasAddedInThisVisit(true);
        setAnnouncement(t('addedAnnouncement', { name }));
    };

    const handleDecrease = () => {
        if (quantityInCart === 1) {
            removeProduct(productId);
            setWasAddedInThisVisit(false);
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
                            quantityInCart === 1
                                ? t('cartControl.remove', { name })
                                : t('cartControl.decrease', { name })
                        }
                    >
                        {quantityInCart === 1
                            ? <FaTrash aria-hidden="true" />
                            : <FaMinus aria-hidden="true" />}
                    </button>

                    <span className={styles.quantity} aria-live="polite">
                        <strong>{quantityInCart}</strong>{' '}
                        <span className={styles.inCartLabel}>{t('cartControl.inCart')}</span>
                    </span>

                    <button
                        type="button"
                        className={styles.stepButton}
                        onClick={() => increaseQuantity(productId)}
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
