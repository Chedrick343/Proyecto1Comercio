/**
 * @fileoverview Último paso del checkout: revisión de la orden y pago.
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '../../utils/formatCurrency';
import { useBranch } from '../../context/BranchContext';
import type { CartItem } from '../../context/CartContext';
import type { ShippingDetails } from './checkoutTypes';
import type { PaymentResult } from './paymentGateway';
import type { Order } from '../../orders/orderTypes';
import { MAX_PAYMENT_ATTEMPTS } from '../../orders/orderStateMachine';
import OrderFailedDialog from './OrderFailedDialog';
import PaymentFailedDialog from './PaymentFailedDialog';
import SandboxScenarioSelector from './SandboxScenarioSelector';
import TermsAcceptanceCheckbox from './TermsAcceptanceCheckbox';
import type { CheckoutStage, SandboxScenarios } from './useOrderPayment';

import styles from './CheckoutEntryPage.module.css';

/** Propiedades de CheckoutOrderReview. */
interface CheckoutOrderReviewProps {
    cart: CartItem[];
    details: ShippingDetails;
    /** Descripción del método de pago elegido. */
    paymentDescription: string;
    /** Resultado del último intento de pago, o null si no hay. */
    paymentResult: PaymentResult | null;
    /** Etapa del proceso en curso, o null si no hay ninguno. */
    processingStage: CheckoutStage | null;
    /** Intentos de pago realizados sobre la orden activa. */
    paymentAttempts: number;
    /** Orden activa si falló, o null. */
    failedOrder: Order | null;
    /** Escenarios que simularán los servicios de pago y de órdenes. */
    sandboxScenarios: SandboxScenarios;
    hasAcceptedTerms: boolean;
    /** Muestra el error de términos no aceptados. */
    showTermsError: boolean;
    onSandboxScenariosChange: (scenarios: SandboxScenarios) => void;
    onTermsAcceptanceChange: (accepted: boolean) => void;
    /** Vuelve al paso de datos de envío. */
    onEditDetails: () => void;
    /** Vuelve al paso de método de pago. */
    onEditPayment: () => void;
    /** Se llama al enviar el formulario de pago. */
    onSubmitPayment: (event: FormEvent<HTMLFormElement>) => void;
    /** Oculta el aviso del último intento de pago. */
    onDismissPaymentResult: () => void;
    /** Descarta la orden fallida para intentar con una nueva. */
    onStartNewOrder: () => void;
}

/**
 * Muestra los productos, los datos de entrega y el método de pago para
 * revisarlos, junto con la aceptación de términos, el selector de escenarios
 * de los servicios simulados y el botón de pago. Los pagos no aprobados y las
 * órdenes fallidas se informan con diálogos; si se cierra el de la orden
 * fallida, el botón de pago pasa a ofrecer una orden nueva.
 *
 * @param props Propiedades del componente.
 * @return El formulario de revisión y pago.
 */
export default function CheckoutOrderReview({
    cart,
    details,
    paymentDescription,
    paymentResult,
    processingStage,
    paymentAttempts,
    failedOrder,
    sandboxScenarios,
    hasAcceptedTerms,
    showTermsError,
    onSandboxScenariosChange,
    onTermsAcceptanceChange,
    onEditDetails,
    onEditPayment,
    onSubmitPayment,
    onDismissPaymentResult,
    onStartNewOrder
}: CheckoutOrderReviewProps) {
    const { t } = useTranslation(['checkout', 'common']);
    const { selectedBranch } = useBranch();
    const [dismissedOrderNumber, setDismissedOrderNumber] = useState<string | null>(null);
    const isCheckoutLocked =
        processingStage !== null || paymentResult === 'PAYMENT_APPROVED' || failedOrder !== null;

    return (
        <form
            className={styles.orderPanel}
            aria-labelledby="review-heading"
            noValidate
            onSubmit={onSubmitPayment}
        >
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
                    <dt>{t('common:branch.shortLabel')}</dt>
                    <dd>{selectedBranch?.name ?? t('common:branch.notSelected')}</dd>
                </div>
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

            <TermsAcceptanceCheckbox
                checked={hasAcceptedTerms}
                showError={showTermsError}
                disabled={isCheckoutLocked}
                onChange={onTermsAcceptanceChange}
            />

            <SandboxScenarioSelector
                scenarios={sandboxScenarios}
                disabled={isCheckoutLocked}
                onScenariosChange={onSandboxScenariosChange}
            />

            <div className={styles.reviewActions}>
                {failedOrder ? (
                    <button className={styles.primaryAction} type="button" onClick={onStartNewOrder}>
                        {t('checkout:orderFailure.newOrder')}
                    </button>
                ) : (
                    <button
                        className={styles.primaryAction}
                        type="submit"
                        disabled={isCheckoutLocked}
                        aria-busy={processingStage !== null}
                    >
                        {t(`checkout:payButton.${getPayButtonState(processingStage, paymentResult, paymentAttempts)}`)}
                    </button>
                )}
            </div>

            <PaymentFailedDialog
                result={paymentResult === 'PAYMENT_APPROVED' || failedOrder ? null : paymentResult}
                remainingAttempts={MAX_PAYMENT_ATTEMPTS - paymentAttempts}
                onClose={onDismissPaymentResult}
            />

            <OrderFailedDialog
                order={failedOrder}
                isOpen={failedOrder !== null && failedOrder.orderNumber !== dismissedOrderNumber}
                onClose={() => setDismissedOrderNumber(failedOrder?.orderNumber ?? null)}
                onStartNewOrder={onStartNewOrder}
            />
        </form>
    );
}

/**
 * Determina el estado del botón de pago.
 *
 * @param processingStage Etapa del proceso en curso, o null si no hay ninguno.
 * @param paymentResult Resultado del último intento de pago.
 * @param paymentAttempts Intentos de pago realizados sobre la orden activa.
 * @return La clave de traducción del texto del botón.
 */
function getPayButtonState(
    processingStage: CheckoutStage | null,
    paymentResult: PaymentResult | null,
    paymentAttempts: number
): CheckoutStage | 'approved' | 'retry' | 'pay' {
    if (processingStage) {
        return processingStage;
    }

    if (paymentResult === 'PAYMENT_APPROVED') {
        return 'approved';
    }

    return paymentAttempts > 0 ? 'retry' : 'pay';
}