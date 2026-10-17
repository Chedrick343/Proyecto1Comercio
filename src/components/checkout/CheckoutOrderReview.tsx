import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '../../utils/formatCurrency';
import type { CartItem } from '../../context/CartContext';
import type { ShippingDetails } from './checkoutTypes';
import type { PaymentResult } from './paymentGateway';
import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';
import SandboxScenarioSelector from './SandboxScenarioSelector';

import styles from './CheckoutEntryPage.module.css';

interface CheckoutOrderReviewProps {
    cart: CartItem[];
    details: ShippingDetails;
    paymentDescription: string;
    paymentResult: PaymentResult | null;
    isProcessingPayment: boolean;
    sandboxScenario: SandboxScenario;
    onSandboxScenarioChange: (scenario: SandboxScenario) => void;
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
    sandboxScenario,
    onSandboxScenarioChange,
    onEditDetails,
    onEditPayment,
    onSubmitPayment
}: CheckoutOrderReviewProps) {
    const { t } = useTranslation(['checkout', 'common']);

    return (
        <section className={styles.orderPanel} aria-labelledby="review-heading">
            <div className={styles.panelHeader}>
                <h2 id="review-heading">{t('checkout:review.title')}</h2>
                <button
                    className={styles.textAction}
                    type="button"
                    onClick={onEditDetails}
                >
                    {t('checkout:review.editDelivery')}
                </button>
            </div>

            <dl className={styles.deliveryDetails}>
                <div>
                    <dt>{t('common:delivery.recipient')}</dt>
                    <dd>{details.fullName}</dd>
                </div>
                <div>
                    <dt>{t('common:delivery.contact')}</dt>
                    <dd>{details.email} · {details.phone}</dd>
                </div>
                <div>
                    <dt>{t('common:delivery.address')}</dt>
                    <dd>
                        {details.address}, {details.canton}, {details.province}
                    </dd>
                </div>
                {details.deliveryNotes.trim() && (
                    <div>
                        <dt>{t('common:delivery.notes')}</dt>
                        <dd>{details.deliveryNotes}</dd>
                    </div>
                )}
            </dl>

            <div className={styles.reviewPayment}>
                <div>
                    <span>{t('checkout:review.paymentMethod')}</span>
                    <strong>{paymentDescription}</strong>
                </div>
                <button
                    className={styles.textAction}
                    type="button"
                    onClick={onEditPayment}
                >
                    {t('checkout:review.changePayment')}
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
                    {t(`checkout:paymentResult.${paymentResult}`)}
                </p>
            )}

            <div className={styles.reviewProductsHeader}>
                <h3>{t('checkout:review.products')}</h3>
                <Link to="/carrito" className={styles.textAction}>
                    {t('checkout:review.editCart')}
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

            <SandboxScenarioSelector
                selectedScenario={sandboxScenario}
                disabled={isProcessingPayment || paymentResult === 'PAYMENT_APPROVED'}
                onScenarioChange={onSandboxScenarioChange}
            />

            <div className={styles.reviewActions}>
                <button
                    className={styles.primaryAction}
                    type="button"
                    disabled={isProcessingPayment || paymentResult === 'PAYMENT_APPROVED'}
                    onClick={onSubmitPayment}
                >
                    {t(`checkout:payButton.${getPayButtonState(isProcessingPayment, paymentResult)}`)}
                </button>
            </div>
        </section>
    );
}

function getPayButtonState(
    isProcessingPayment: boolean,
    paymentResult: PaymentResult | null
): 'processing' | 'approved' | 'retry' | 'pay' {
    if (isProcessingPayment) {
        return 'processing';
    }

    if (paymentResult === 'PAYMENT_APPROVED') {
        return 'approved';
    }

    return paymentResult ? 'retry' : 'pay';
}