import {
    FaMinus,
    FaPlus,
    FaTrash,
    FaShoppingCart
} from 'react-icons/fa';

import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { IVA_RATE, SHIPPING_RATE, useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';

import styles from './carritoSection.module.css';

export default function CarritoSection() {
    const {
        cart,
        increaseQuantity,
        decreaseQuantity,
        removeProduct,
        subtotal,
        iva,
        shipping,
        total
    } = useCart();

    const { t } = useTranslation(['cart', 'common']);

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

                    <Link
                        to="/checkout"
                        className={styles.checkoutButton}
                    >
                        {t('cart:checkout')}
                    </Link>

                    <p className={styles.shippingNote}>
                        {t('cart:shippingNote')}
                    </p>

                </aside>

            </div>
        </section>
    );
}