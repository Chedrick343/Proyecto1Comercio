import { IVA_RATE, SHIPPING_RATE } from '../../context/CartContext';
import type { Order } from '../../orders/orderTypes';
import { formatCurrency } from '../../utils/formatCurrency';
import { OrderStatusBadge, PaymentStatusBadge } from './OrderStatusBadge';

import styles from './OrderDetails.module.css';

const formatRate = (rate: number) => `${Math.round(rate * 100)}%`;

export default function OrderDetails({ order }: { order: Order }) {
    const { customer } = order;

    return (
        <div className={styles.orderDetails}>
            <section className={styles.panel} aria-labelledby="order-status-heading">
                <h2 id="order-status-heading">Estado</h2>

                <dl className={styles.infoList}>
                    <div>
                        <dt>Orden</dt>
                        <dd><OrderStatusBadge status={order.orderStatus} /></dd>
                    </div>
                    <div>
                        <dt>Pago</dt>
                        <dd><PaymentStatusBadge status={order.paymentStatus} /></dd>
                    </div>
                    {order.transactionId && (
                        <div>
                            <dt>Transacción</dt>
                            <dd>{order.transactionId}</dd>
                        </div>
                    )}
                </dl>
            </section>

            <section className={styles.panel} aria-labelledby="order-delivery-heading">
                <h2 id="order-delivery-heading">Entrega</h2>

                <dl className={styles.infoList}>
                    <div>
                        <dt>Recibe</dt>
                        <dd>{customer.fullName}</dd>
                    </div>
                    <div>
                        <dt>Contacto</dt>
                        <dd>{customer.email} · {customer.phone}</dd>
                    </div>
                    <div>
                        <dt>Dirección</dt>
                        <dd>
                            {customer.address}, {customer.canton}, {customer.province}
                        </dd>
                    </div>
                    {customer.deliveryNotes.trim() && (
                        <div>
                            <dt>Indicaciones</dt>
                            <dd>{customer.deliveryNotes}</dd>
                        </div>
                    )}
                </dl>
            </section>

            <section
                className={`${styles.panel} ${styles.productsPanel}`}
                aria-labelledby="order-products-heading"
            >
                <h2 id="order-products-heading">Productos</h2>

                <table className={styles.itemsTable}>
                    <thead>
                        <tr>
                            <th scope="col">Producto</th>
                            <th scope="col">Cantidad</th>
                            <th scope="col">Precio unitario</th>
                            <th scope="col">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item) => (
                            <tr key={item.productId}>
                                <td data-label="Producto">{item.name}</td>
                                <td data-label="Cantidad">{item.quantity}</td>
                                <td data-label="Precio unitario">
                                    {formatCurrency(item.unitPrice, item.currency)}
                                </td>
                                <td data-label="Subtotal">
                                    {formatCurrency(item.lineSubtotal, item.currency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <dl className={styles.totals}>
                    <div>
                        <dt>Subtotal</dt>
                        <dd>{formatCurrency(order.subtotal, order.currency)}</dd>
                    </div>
                    <div>
                        <dt>IVA ({formatRate(IVA_RATE)})</dt>
                        <dd>{formatCurrency(order.iva, order.currency)}</dd>
                    </div>
                    <div>
                        <dt>Envío ({formatRate(SHIPPING_RATE)})</dt>
                        <dd>{formatCurrency(order.shipping, order.currency)}</dd>
                    </div>
                    <div className={styles.totalRow}>
                        <dt>Total</dt>
                        <dd>{formatCurrency(order.total, order.currency)}</dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}
