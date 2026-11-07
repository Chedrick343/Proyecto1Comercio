/**
 * @fileoverview Aviso modal de una orden que falló durante el checkout.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';

import { MAX_PAYMENT_ATTEMPTS } from '../../orders/orderStateMachine';
import type { Order } from '../../orders/orderTypes';
import ActionDialog from '../dialog/ActionDialog';

import dialogStyles from '../dialog/ActionDialog.module.css';
import styles from './OrderFailedDialog.module.css';

/** Propiedades de OrderFailedDialog. */
interface OrderFailedDialogProps {
    /** Orden en estado FAILED, o null si no hay ninguna. */
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    /** Descarta la orden fallida para intentar la compra con una nueva. */
    onStartNewOrder: () => void;
}

/**
 * Obtiene la clave del mensaje que explica el fallo. Una falla al confirmar
 * cuyo pago sigue aprobado indica que el reembolso automático no se completó.
 *
 * @param order Orden fallida.
 * @return La clave de traducción dentro de orderFailure.reasons.
 */
function getReasonKey(order: Order) {
    const reason = order.failureReason ?? 'CONFIRMATION_ERROR';

    return reason === 'CONFIRMATION_ERROR' && order.paymentStatus === 'APPROVED'
        ? 'REFUND_PENDING'
        : reason;
}

/**
 * Explica por qué falló la orden y si se cobró o se reembolsó, y ofrece
 * volver al carrito o intentar con una orden nueva. La orden fallida queda
 * registrada y se puede consultar desde el enlace del diálogo.
 *
 * @param props Propiedades del componente.
 * @return El diálogo.
 */
export default function OrderFailedDialog({
    order,
    isOpen,
    onClose,
    onStartNewOrder
}: OrderFailedDialogProps) {
    const { t } = useTranslation('checkout');

    return (
        <ActionDialog
            isOpen={isOpen && order !== null}
            onClose={onClose}
            icon={FaExclamationTriangle}
            tone="danger"
            eyebrow={t('orderFailure.eyebrow')}
            title={t('orderFailure.title')}
            description={
                order
                    ? t(`orderFailure.reasons.${getReasonKey(order)}`, { count: MAX_PAYMENT_ATTEMPTS })
                    : undefined
            }
            actions={
                <>
                    <Link to="/carrito" className={dialogStyles.secondaryAction} onClick={onClose}>
                        {t('orderFailure.backToCart')}
                    </Link>
                    <button type="button" className={dialogStyles.primaryAction} onClick={onStartNewOrder}>
                        {t('orderFailure.newOrder')}
                    </button>
                </>
            }
        >
            {order && (
                <Link to={`/orden/${order.orderNumber}`} className={styles.orderLink}>
                    {t('orderFailure.viewOrder', { orderNumber: order.orderNumber })}
                </Link>
            )}
        </ActionDialog>
    );
}
