import { Link, Navigate } from 'react-router-dom';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';

import styles from './CheckoutEntryPage.module.css';

export default function CheckoutEntryPage() {
    const {
        cart,
        totalItems,
        subtotal,
        iva,
        shipping,
        total
    } = useCart();

    if (cart.length === 0) {
        return <Navigate to="/carrito" replace />;
    }

    return (
        <main className="app">
            <div className="top-bar">
                <Header />
            </div>

            <section className={styles.checkoutPage}>
                <header className={styles.pageHeader}>
                    <Link to="/carrito" className={styles.backLink}>
                        ← Volver al carrito
                    </Link>

                    <p className={styles.eyebrow}>TU COMPRA</p>
                    <h1>Finalizar compra</h1>
                    <p className={styles.description}>
                        Revisa los productos y montos antes de continuar.
                    </p>
                </header>

                <ol className={styles.checkoutSteps} aria-label="Etapas de compra">
                    <li aria-current="step" className={styles.currentStep}>
                        <span className={styles.stepNumber}>1</span>
                        <span>Resumen</span>
                    </li>
                    <li>
                        <span className={styles.stepNumber}>2</span>
                        <span>Entrega</span>
                    </li>
                    <li>
                        <span className={styles.stepNumber}>3</span>
                        <span>Pago</span>
                    </li>
                </ol>

                <div className={styles.checkoutLayout}>
                    <section className={styles.orderPanel} aria-labelledby="order-heading">
                        <div className={styles.panelHeader}>
                            <h2 id="order-heading">Productos</h2>
                            <span>
                                {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
                            </span>
                        </div>

                        <ul className={styles.productList}>
                            {cart.map((item) => (
                                <li key={item.id} className={styles.productRow}>
                                    <div className={styles.productInfo}>
                                        <h3>{item.name}</h3>
                                        <p>
                                            {item.quantity} ×{' '}
                                            {formatCurrency(item.price, item.currency)}
                                        </p>
                                    </div>
                                    <strong>
                                        {formatCurrency(
                                            item.price * item.quantity,
                                            item.currency
                                        )}
                                    </strong>
                                </li>
                            ))}
                        </ul>

                        <Link to="/carrito" className={styles.editCartLink}>
                            Editar carrito
                        </Link>
                    </section>

                    <aside className={styles.summaryPanel} aria-labelledby="summary-heading">
                        <h2 id="summary-heading">Resumen de compra</h2>

                        <dl className={styles.summaryRows}>
                            <div>
                                <dt>Subtotal</dt>
                                <dd>{formatCurrency(subtotal)}</dd>
                            </div>
                            <div>
                                <dt>IVA (13%)</dt>
                                <dd>{formatCurrency(iva)}</dd>
                            </div>
                            <div>
                                <dt>Envío (5%)</dt>
                                <dd>{formatCurrency(shipping)}</dd>
                            </div>
                        </dl>

                        <div className={styles.totalRow}>
                            <span>Total</span>
                            <strong>{formatCurrency(total)}</strong>
                        </div>
                    </aside>
                </div>
            </section>

            <NavBar />
        </main>
    );
}