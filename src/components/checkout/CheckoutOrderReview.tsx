import { Link } from 'react-router-dom';

import { formatCurrency } from '../../utils/formatCurrency';
import type { CartItem } from '../../context/CartContext';
import type { ShippingDetails } from './checkoutTypes';
import type { PaymentResult } from './paymentProcessing';

import styles from './CheckoutEntryPage.module.css';

interface CheckoutOrderReviewProps {
    cart: CartItem[];
    details: ShippingDetails;
    paymentDescription: string;
    paymentResult: PaymentResult | null;
    isProcessingPayment: boolean;
    onEditDetails: () => void;
    onEditPayment: () => void;
    onSubmitPayment: () => void;
}

export default function CheckoutOrderReview({
    cart,
    details,
    paymentDescription,
    paymentResult,
    isProcessingPayment,
    onEditDetails,
    onEditPayment,
    onSubmitPayment
}: CheckoutOrderReviewProps) {
    return (
        <section className={styles.orderPanel} aria-labelledby="review-heading">
            <div className={styles.panelHeader}>
                <h2 id="review-heading">Revisión del pedido</h2>
                <button
                    className={styles.textAction}
                    type="button"
                    onClick={onEditDetails}
                >
                    Editar entrega
                </button>
            </div>

            <dl className={styles.deliveryDetails}>
                <div>
                    <dt>Recibe</dt>
                    <dd>{details.fullName}</dd>
                </div>
                <div>
                    <dt>Contacto</dt>
                    <dd>{details.email} · {details.phone}</dd>
                </div>
                <div>
                    <dt>Dirección</dt>
                    <dd>
                        {details.address}, {details.canton}, {details.province}
                    </dd>
                </div>
                {details.deliveryNotes.trim() && (
                    <div>
                        <dt>Indicaciones</dt>
                        <dd>{details.deliveryNotes}</dd>
                    </div>
                )}
            </dl>

            <div className={styles.reviewPayment}>
                <div>
                    <span>Método de pago</span>
                    <strong>{paymentDescription}</strong>
                </div>
                <button
                    className={styles.textAction}
                    type="button"
                    onClick={onEditPayment}
                >
                    Cambiar
                </button>
            </div>

            {paymentResult && (
                <p
                    className={
                        paymentResult === 'PAYMENT_APPROVED'
                            ? `${styles.paymentFeedback} ${styles.paymentApproved}`
                            : `${styles.paymentFeedback} ${styles.paymentFailed}`
                    }
                    role={paymentResult === 'PAYMENT_APPROVED' ? 'status' : 'alert'}
                >
                    {getPaymentResultMessage(paymentResult)}
                </p>
            )}

            <div className={styles.reviewProductsHeader}>
                <h3>Productos</h3>
                <Link to="/carrito" className={styles.textAction}>
                    Editar carrito
                </Link>
            </div>

            <ul className={styles.productList}>
                {cart.map((item) => (
                    <li key={item.id} className={styles.productRow}>
                        <div className={styles.productInfo}>
                            <h4>{item.name}</h4>
                            <p>
                                {item.quantity} × {formatCurrency(item.price, item.currency)}
                            </p>
                        </div>
                        <strong>
                            {formatCurrency(item.price * item.quantity, item.currency)}
                        </strong>
                    </li>
                ))}
            </ul>

            <div className={styles.reviewActions}>
                <button
                    className={styles.primaryAction}
                    type="button"
                    disabled={isProcessingPayment || paymentResult === 'PAYMENT_APPROVED'}
                    onClick={onSubmitPayment}
                >
                    {isProcessingPayment
                        ? 'Procesando pago...'
                        : paymentResult === 'PAYMENT_APPROVED'
                            ? 'Pago aprobado'
                            : paymentResult
                                ? 'Intentar pagar nuevamente'
                                : 'Confirmar y pagar'}
                </button>
            </div>
        </section>
    );
}

function getPaymentResultMessage(result: PaymentResult): string {
    switch (result) {
        case 'PAYMENT_APPROVED':
            return 'El pago fue aprobado. Gracias por tu compra.';
        case 'PAYMENT_DECLINED':
            return 'El pago no fue aprobado. Puedes intentarlo nuevamente.';
        case 'PAYMENT_ERROR':
            return 'No pudimos procesar el pago. Inténtalo nuevamente en unos momentos.';
    }
}