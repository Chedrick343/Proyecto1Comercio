/**
 * @fileoverview Panel lateral con la vista previa del carrito.
 */

import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaMinus, FaPlus, FaShoppingCart, FaTimes, FaTrash } from 'react-icons/fa';

import { IVA_RATE, useCart, type CartItem } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';

import styles from './CartPreview.module.css';

/** Propiedades de CartPreview. */
interface CartPreviewProps {
    /** Indica si el panel está abierto. */
    isOpen: boolean;
    /** Se llama cuando el panel se cierra. */
    onClose: () => void;
}

/**
 * Muestra un producto del carrito con controles para cambiar su cantidad.
 * Disminuir cuando queda una unidad elimina el producto.
 *
 * @param props Propiedades del componente.
 * @param props.item Producto del carrito.
 * @return La fila del producto.
 */
function CartPreviewItem({ item }: { item: CartItem }) {
    const { t } = useTranslation('cart');
    const { increaseQuantity, decreaseQuantity, removeProduct } = useCart();
    const removesItem = item.quantity === 1;

    return (
        <li className={styles.item}>
            <img className={styles.itemImage} src={item.image} alt="" />

            <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemPrice}>{formatCurrency(item.price, item.currency)}</p>

                <div className={styles.itemControls}>
                    <button
                        type="button"
                        onClick={() => (removesItem ? removeProduct(item.id) : decreaseQuantity(item.id))}
                        aria-label={
                            removesItem
                                ? t('item.removeNamed', { name: item.name })
                                : t('item.decrease', { name: item.name })
                        }
                    >
                        {removesItem ? <FaTrash aria-hidden="true" /> : <FaMinus aria-hidden="true" />}
                    </button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button
                        type="button"
                        onClick={() => increaseQuantity(item.id)}
                        aria-label={t('item.increase', { name: item.name })}
                    >
                        <FaPlus aria-hidden="true" />
                    </button>
                </div>
            </div>

            <strong className={styles.itemSubtotal}>
                {formatCurrency(item.price * item.quantity, item.currency)}
            </strong>
        </li>
    );
}

/**
 * Muestra el carrito en un panel lateral sobre la página, usando el
 * elemento <dialog> nativo. Se cierra al navegar, con Escape o al hacer
 * clic fuera del panel.
 *
 * @param props Propiedades del componente.
 * @return El panel de vista previa.
 */
export default function CartPreview({ isOpen, onClose }: CartPreviewProps) {
    const { t } = useTranslation(['cart', 'common', 'product']);
    const { cart, totalItems, subtotal } = useCart();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const location = useLocation();

    useEffect(() => {
        const dialog = dialogRef.current;

        if (isOpen && !dialog?.open) {
            dialog?.showModal();
        } else if (!isOpen && dialog?.open) {
            dialog.close();
        }
    }, [isOpen]);

    // Any navigation (including the links inside the panel) closes it.
    useEffect(() => {
        dialogRef.current?.close();
    }, [location.key]);

    /** Cierra el panel; el evento close del diálogo notifica a onClose. */
    const closePreview = () => dialogRef.current?.close();
    const isEmpty = cart.length === 0;

    return (
        <dialog
            ref={dialogRef}
            className={styles.drawer}
            aria-labelledby="cart-preview-title"
            onClose={onClose}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    closePreview();
                }
            }}
        >
            <div className={styles.panel}>
                <header className={styles.header}>
                    <h2 id="cart-preview-title">
                        {t('cart:preview.title')}
                        {!isEmpty && (
                            <span className={styles.count}>
                                {t('common:itemCount', { count: totalItems })}
                            </span>
                        )}
                    </h2>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={closePreview}
                        aria-label={t('cart:preview.close')}
                    >
                        <FaTimes aria-hidden="true" />
                    </button>
                </header>

                {isEmpty ? (
                    <div className={styles.empty}>
                        <FaShoppingCart className={styles.emptyIcon} aria-hidden="true" />
                        <p className={styles.emptyTitle}>{t('cart:empty.title')}</p>
                        <p>{t('cart:empty.description')}</p>
                        <Link to="/" className={styles.primaryAction}>
                            {t('cart:preview.explore')}
                        </Link>
                    </div>
                ) : (
                    <>
                        <ul className={styles.items}>
                            {cart.map((item) => (
                                <CartPreviewItem key={item.id} item={item} />
                            ))}
                        </ul>

                        <footer className={styles.footer}>
                            <div className={styles.subtotalRow}>
                                <span>{t('common:summary.subtotal')}</span>
                                <strong>{formatCurrency(subtotal)}</strong>
                            </div>
                            <p className={styles.note}>
                                {t('product:priceNote', { rate: formatRate(IVA_RATE) })}
                            </p>

                            <div className={styles.actions}>
                                <Link to="/carrito" className={styles.secondaryAction}>
                                    {t('cart:preview.viewCart')}
                                </Link>
                                <Link to="/checkout" className={styles.primaryAction}>
                                    {t('cart:preview.checkout')}
                                </Link>
                            </div>
                        </footer>
                    </>
                )}
            </div>
        </dialog>
    );
}
