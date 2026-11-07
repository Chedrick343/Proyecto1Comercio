/**
 * @fileoverview Página de confirmación y detalle de una orden.
 */

import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaReceipt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import { useOrders } from '../../context/OrdersContext';
import type { Order } from '../../orders/orderTypes';
import { formatDateTime } from '../../utils/formatDate';
import OrderDetails from './OrderDetails';
import ErrorState from '../error/ErrorState';

import styles from './OrderConfirmationPage.module.css';

/**
 * Muestra el encabezado de la orden. Si está confirmada, celebra la compra
 * e indica el correo de confirmación.
 *
 * @param props Propiedades del componente.
 * @param props.order Orden a mostrar.
 * @return El encabezado con el número y la fecha de la orden.
 */
function OrderHeading({ order }: { order: Order }) {
    const { t } = useTranslation('orders');
    const isConfirmed = order.orderStatus === 'CONFIRMED';
    const HeadingIcon = isConfirmed ? FaCheckCircle : FaReceipt;

    return (
        <header className={styles.heading}>
            <HeadingIcon
                className={isConfirmed ? styles.confirmedIcon : styles.neutralIcon}
                aria-hidden="true"
            />

            <p className={styles.eyebrow}>
                {isConfirmed ? t('confirmation.eyebrowConfirmed') : t('confirmation.eyebrowDetail')}
            </p>

            <h1>{isConfirmed ? t('confirmation.titleConfirmed') : t('confirmation.titleDetail')}</h1>

            {isConfirmed && (
                <p className={styles.description}>
                    {t('confirmation.emailNotice', { email: order.customer.email })}
                </p>
            )}

            <dl className={styles.orderMeta}>
                <div>
                    <dt>{t('confirmation.orderNumber')}</dt>
                    <dd>{order.orderNumber}</dd>
                </div>
                <div>
                    <dt>{t('confirmation.date')}</dt>
                    <dd>{formatDateTime(order.createdAt)}</dd>
                </div>
            </dl>
        </header>
    );
}

/**
 * Indica que no existe una orden con el número solicitado.
 *
 * @param props Propiedades del componente.
 * @param props.orderNumber Número de orden buscado.
 * @return El mensaje de error.
 */
function OrderNotFound({ orderNumber }: { orderNumber: string }) {
    const { t } = useTranslation('orders');

    return (
        <ErrorState
            icon={FaReceipt}
            title={t('notFound.title')}
            description={t('notFound.description', { orderNumber })}
        />
    );
}

/**
 * Muestra la orden indicada en la URL, o un error si no existe.
 *
 * @return La página de la orden.
 */
export default function OrderConfirmationPage() {
    const { t } = useTranslation(['orders', 'common']);
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
                        <Link to="/cuenta/pedidos" className={styles.secondaryAction}>
                            {t('orders:actions.viewOrders')}
                        </Link>
                        <Link to="/" className={styles.primaryAction}>
                            {t('common:actions.continueShopping')}
                        </Link>
                    </div>
                </div>
            </section>

            <NavBar />
        </main>
    );
}
