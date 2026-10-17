import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaReceipt } from 'react-icons/fa';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import { useOrders } from '../../context/OrdersContext';
import type { Order } from '../../orders/orderTypes';
import { formatDateTime } from '../../utils/formatDate';
import OrderDetails from './OrderDetails';

import styles from './OrderConfirmationPage.module.css';

function OrderHeading({ order }: { order: Order }) {
    const isConfirmed = order.orderStatus === 'CONFIRMED';
    const HeadingIcon = isConfirmed ? FaCheckCircle : FaReceipt;

    return (
        <header className={styles.heading}>
            <HeadingIcon
                className={isConfirmed ? styles.confirmedIcon : styles.neutralIcon}
                aria-hidden="true"
            />

            <p className={styles.eyebrow}>
                {isConfirmed ? 'COMPRA CONFIRMADA' : 'DETALLE DEL PEDIDO'}
            </p>

            <h1>{isConfirmed ? '¡Gracias por tu compra!' : 'Tu pedido'}</h1>

            {isConfirmed && (
                <p className={styles.description}>
                    Enviaremos los detalles de tu pedido a {order.customer.email}.
                </p>
            )}

            <dl className={styles.orderMeta}>
                <div>
                    <dt>Número de orden</dt>
                    <dd>{order.orderNumber}</dd>
                </div>
                <div>
                    <dt>Fecha</dt>
                    <dd>{formatDateTime(order.createdAt)}</dd>
                </div>
            </dl>
        </header>
    );
}

function OrderNotFound({ orderNumber }: { orderNumber: string }) {
    return (
        <div className={styles.notFound} role="alert">
            <h1>No encontramos este pedido</h1>
            <p>
                No existe un pedido con el número {orderNumber || 'indicado'} en
                este dispositivo.
            </p>
        </div>
    );
}

export default function OrderConfirmationPage() {
    const { orderNumber = '' } = useParams();
    const { getOrderByNumber } = useOrders();
    const order = getOrderByNumber(orderNumber);

    return (
        <main className="app">
            <div className="top-bar">
                <Header />
            </div>

            <section className={styles.page}>
                <div className={styles.content}>
                    {order ? (
                        <>
                            <OrderHeading order={order} />
                            <OrderDetails order={order} />
                        </>
                    ) : (
                        <OrderNotFound orderNumber={orderNumber} />
                    )}

                    <div className={styles.actions}>
                        <Link to="/" className={styles.primaryAction}>
                            Seguir comprando
                        </Link>
                    </div>
                </div>
            </section>

            <NavBar />
        </main>
    );
}
