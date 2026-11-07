/**
 * @fileoverview Aviso modal de un intento de pago que no se aprobó.
 */

import { useTranslation } from 'react-i18next';
import { FaCreditCard, FaPlug } from 'react-icons/fa';

import ActionDialog from '../dialog/ActionDialog';
import type { PaymentResult } from './paymentGateway';

import dialogStyles from '../dialog/ActionDialog.module.css';

/** Resultados de pago que se informan con este diálogo. */
type FailedPaymentResult = Exclude<PaymentResult, 'PAYMENT_APPROVED'>;

/** Ícono de cada resultado: tarjeta para rechazos y conector para fallas del servicio. */
const RESULT_ICONS = {
    PAYMENT_DECLINED: FaCreditCard,
    PAYMENT_ERROR: FaPlug
} as const;

/** Propiedades de PaymentFailedDialog. */
interface PaymentFailedDialogProps {
    /** Resultado del último intento, o null si no hay nada que informar. */
    result: FailedPaymentResult | null;
    /** Intentos de pago que le quedan a la orden. */
    remainingAttempts: number;
    onClose: () => void;
}

/**
 * Informa que el pago fue rechazado o que el servicio falló, y cuántos
 * intentos quedan. La orden sigue pendiente, así que solo ofrece cerrar para
 * volver a intentarlo desde el checkout.
 *
 * @param props Propiedades del componente.
 * @return El diálogo.
 */
export default function PaymentFailedDialog({
    result,
    remainingAttempts,
    onClose
}: PaymentFailedDialogProps) {
    const { t } = useTranslation('checkout');
    const shownResult = result ?? 'PAYMENT_DECLINED';

    return (
        <ActionDialog
            isOpen={result !== null}
            onClose={onClose}
            icon={RESULT_ICONS[shownResult]}
            tone="danger"
            eyebrow={t(`paymentDialog.${shownResult}.eyebrow`)}
            title={t(`paymentDialog.${shownResult}.title`)}
            description={t(`paymentDialog.${shownResult}.description`, { count: remainingAttempts })}
            actions={
                <button type="button" className={dialogStyles.primaryAction} onClick={onClose}>
                    {t('paymentDialog.close')}
                </button>
            }
        />
    );
}
