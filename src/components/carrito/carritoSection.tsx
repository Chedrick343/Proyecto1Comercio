/**
 * @fileoverview Página del carrito de compras.
 */

import {
    FaMinus,
    FaPlus,
    FaTrash,
    FaShoppingCart
} from 'react-icons/fa';

import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { IVA_RATE, SHIPPING_RATE, useCart, type CartItem } from '../../context/CartContext';
import { isBelowMinimum } from '../../pricing/businessMinimum';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';
import PriceTierNote from '../product-price/PriceTierNote';

import styles from './carritoSection.module.css';

/** Propiedades de BusinessMinimumLine. */
interface BusinessMinimumLineProps {
    item: CartItem;
    /** Cambia la cantidad del producto. */
    onAdjust: (id: string, quantity: number) => void;
}

/**
 * Indica el mínimo de compra B2B de un producto del carrito. Si la cantidad
 * no lo alcanza, lo marca como error y ofrece ajustarla al mínimo.
 *
 * @param props Propiedades del componente.
 * @return La línea del mínimo de compra.
 */
function BusinessMinimumLine({ item, onAdjust }: BusinessMinimumLineProps) {
    const { t } = useTranslation('cart');

    if (!isBelowMinimum(item.quantity, item.minimumQuantity)) {
        return (
            <p className={styles.minimumNote}>
                {t('minimum.note', { count: item.minimumQuantity })}
            </p>
        );
    }

    return (
        <p className={`${styles.minimumNote} ${styles.minimumNoteError}`}>
            {t('minimum.below', {
                count: item.minimumQuantity,
                missing: item.minimumQuantity - item.quantity
            })}
            <button
                type="button"
                className={styles.adjustMinimumButton}
                onClick={() => onAdjust(item.id, item.minimumQuantity)}
            >
                {t('minimum.adjust', { count: item.minimumQuantity })}
            </button>
        </p>
    );
}

/**
 * Muestra los productos del carrito con controles de cantidad y el resumen
 * de la compra. Para un cliente B2B, indica el mínimo de compra de cada
 * producto y no deja continuar mientras alguno no lo alcance. Si el carrito
 * está vacío, lo indica y avisa cuando se llegó aquí porque el checkout se
 * bloqueó por falta de productos.
 *
 * @return La sección del carrito.
 */
export default function CarritoSection() {
    const {
        cart,
        increaseQuantity,
        decreaseQuantity,
        removeProduct,
        setItemQuantity,
        subtotal,
        iva,
        shipping,
        total
    } = useCart();

    const { t } = useTranslation(['cart', 'common']);
    const hasItemsBelowMinimum = cart.some((item) =>
        isBelowMinimum(item.quantity, item.minimumQuantity)
    );

    const location = useLocation();
    const wasRedirectedFromCheckout = Boolean(
        (location.state as { checkoutBlockedByEmptyCart?: boolean } | null)
            ?.checkoutBlockedByEmptyCart
    );

    if (cart.length === 0) {
        return (
            <section className={styles.cartPage}>
                <div className={styles.emptyCart}>
                    <div className={styles.emptyIcon}>
                        <FaShoppingCart />
                    </div>

                    <h1>{t('cart:empty.title')}</h1>

                    {wasRedirectedFromCheckout && (
                        <p
                            className={styles.emptyCartNotice}
                            role="alert"
                        >
                            {t('cart:empty.checkoutBlocked')}
                        </p>
                    )}

                    <p>
                        {t('cart:empty.description')}
                    </p>

                    <Link
                        to="/"
                        className={styles.catalogButton}
                    >
                        ← {t('common:actions.backToCatalog')}
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.cartPage}>

            <div className={styles.cartHeader}>
                <div>
                    <p className={styles.eyebrow}>
                        {t('common:yourPurchase')}
                    </p>

                    <h1>{t('cart:title')}</h1>

                    <p className={styles.cartDescription}>
                        {t('cart:description')}
                    </p>
                </div>

                <span className={styles.itemCount}>
                    {t('cart:productCount', { count: cart.length })}
                </span>
            </div>

            <div className={styles.cartLayout}>

                {/* PRODUCTOS */}

                <div className={styles.productsContainer}>

                    {cart.map((item) => {
                        const itemSubtotal =
                            item.price * item.quantity;

                        return (
                            <article
                                key={item.id}
                                className={styles.cartItem}
                            >

                                <div className={styles.imageContainer}>
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className={styles.productImage}
                                    />
                                </div>

                                <div className={styles.productInfo}>

                                    <h2>
                                        {item.name}
                                    </h2>

                                    <p className={styles.unitPrice}>
                                        {formatCurrency(
                                            item.price,
                                            item.currency
                                        )}{' '}
                                        <span>
                                            / unidad
                                        </span>
                                    </p>

                                    {item.minimumQuantity > 1 && (
                                        <BusinessMinimumLine item={item} onAdjust={setItemQuantity} />
                                    )}

                                    <div className={styles.itemBottom}>

                                        <div
                                            className={
                                                styles.quantitySelector
                                            }
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    decreaseQuantity(
                                                        item.id
                                                    )
                                                }
                                                disabled={item.quantity <= item.minimumQuantity}
                                                aria-label={t('cart:item.decrease', { name: item.name })}
                                            >
                                                <FaMinus />
                                            </button>

                                            <span>
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    increaseQuantity(
                                                        item.id
                                                    )
                                                }
                                                aria-label={t('cart:item.increase', { name: item.name })}
                                            >
                                                <FaPlus />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            className={
                                                styles.removeButton
                                            }
                                            onClick={() =>
                                                removeProduct(
                                                    item.id
                                                )
                                            }
                                        >
                                            <FaTrash />

                                            <span>
                                                {t('cart:item.remove')}
                                            </span>
                                        </button>

                                    </div>
                                </div>

                                <div className={styles.itemSubtotal}>
                                    <span>
                                        {t('common:summary.subtotal')}
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            itemSubtotal,
                                            item.currency
                                        )}
                                    </strong>
                                </div>

                            </article>
                        );
                    })}

                    <Link
                        to="/"
                        className={styles.continueShopping}
                    >
                        ← {t('common:actions.continueShopping')}
                    </Link>

                </div>

                {/* RESUMEN */}

                <aside className={styles.summaryCard}>

                    <div className={styles.summaryHeader}>
                        <h2>
                            {t('common:summary.title')}
                        </h2>
                    </div>

                    <PriceTierNote />

                    <div className={styles.summaryRows}>

                        <div>
                            <span>
                                {t('common:summary.subtotal')}
                            </span>

                            <strong>
                                {formatCurrency(subtotal)}
                            </strong>
                        </div>

                        <div>
                            <span>
                                {t('common:summary.iva', { rate: formatRate(IVA_RATE) })}
                            </span>

                            <strong>
                                {formatCurrency(iva)}
                            </strong>
                        </div>

                        <div>
                            <span>
                                {t('common:summary.shipping', { rate: formatRate(SHIPPING_RATE) })}
                            </span>

                            <strong>
                                {formatCurrency(shipping)}
                            </strong>
                        </div>

                    </div>

                    <div className={styles.divider} />

                    <div className={styles.totalRow}>
                        <span>
                            {t('common:summary.total')}
                        </span>

                        <strong>
                            {formatCurrency(total)}
                        </strong>
                    </div>

                    {hasItemsBelowMinimum ? (
                        <>
                            <p className={styles.minimumBlockedNote} role="alert">
                                {t('cart:minimum.checkoutBlocked')}
                            </p>
                            <span
                                className={`${styles.checkoutButton} ${styles.checkoutButtonDisabled}`}
                                aria-disabled="true"
                            >
                                {t('cart:checkout')}
                            </span>
                        </>
                    ) : (
                        <Link
                            to="/checkout"
                            className={styles.checkoutButton}
                        >
                            {t('cart:checkout')}
                        </Link>
                    )}

                    <p className={styles.shippingNote}>
                        {t('cart:shippingNote')}
                    </p>

                </aside>

            </div>
        </section>
    );
}