import {
    FaMinus,
    FaPlus,
    FaTrash,
    FaShoppingCart
} from 'react-icons/fa';

import { Link } from 'react-router-dom';

import { useCart } from '../../context/CartContext';

import styles from './carritoSection.module.css';

const formatPrice = (
    price: number,
    currency: string = 'CRC'
) => {
    return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
};

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

    if (cart.length === 0) {
        return (
            <section className={styles.cartPage}>
                <div className={styles.emptyCart}>
                    <div className={styles.emptyIcon}>
                        <FaShoppingCart />
                    </div>

                    <h1>Tu carrito está vacío</h1>

                    <p>
                        Todavía no has agregado productos
                        a tu carrito.
                    </p>

                    <Link
                        to="/"
                        className={styles.catalogButton}
                    >
                        ← Volver al catálogo
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
                        TU COMPRA
                    </p>

                    <h1>Carrito de compras</h1>

                    <p className={styles.cartDescription}>
                        Revisa tus productos antes de
                        continuar con tu compra.
                    </p>
                </div>

                <span className={styles.itemCount}>
                    {cart.length}{' '}
                    {cart.length === 1
                        ? 'producto'
                        : 'productos'}
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
                                        {formatPrice(
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
                                                aria-label={`Disminuir cantidad de ${item.name}`}
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
                                                aria-label={`Aumentar cantidad de ${item.name}`}
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
                                                Eliminar
                                            </span>
                                        </button>

                                    </div>
                                </div>

                                <div className={styles.itemSubtotal}>
                                    <span>
                                        Subtotal
                                    </span>

                                    <strong>
                                        {formatPrice(
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
                        ← Continuar comprando
                    </Link>

                </div>

                {/* RESUMEN */}

                <aside className={styles.summaryCard}>

                    <div className={styles.summaryHeader}>
                        <h2>
                            Resumen de compra
                        </h2>
                    </div>

                    <div className={styles.summaryRows}>

                        <div>
                            <span>
                                Subtotal
                            </span>

                            <strong>
                                {formatPrice(subtotal)}
                            </strong>
                        </div>

                        <div>
                            <span>
                                IVA (13%)
                            </span>

                            <strong>
                                {formatPrice(iva)}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Envío (5%)
                            </span>

                            <strong>
                                {formatPrice(shipping)}
                            </strong>
                        </div>

                    </div>

                    <div className={styles.divider} />

                    <div className={styles.totalRow}>
                        <span>
                            Total
                        </span>

                        <strong>
                            {formatPrice(total)}
                        </strong>
                    </div>

                    <button
                        type="button"
                        className={styles.checkoutButton}
                    >
                        Continuar con la compra
                    </button>

                    <p className={styles.shippingNote}>
                        El costo de envío se calcula
                        automáticamente según el subtotal
                        de tu compra.
                    </p>

                </aside>

            </div>
        </section>
    );
}