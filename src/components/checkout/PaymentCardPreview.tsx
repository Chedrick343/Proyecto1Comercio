import { FaWifi } from 'react-icons/fa';

import { getMaskedCardNumber } from './paymentCard';
import styles from './CheckoutEntryPage.module.css';

interface PaymentCardPreviewProps {
    cardholder: string;
    lastFourDigits: string;
    expirationMonth: string;
    expirationYear: string;
    label: string;
}

export default function PaymentCardPreview({
    cardholder,
    lastFourDigits,
    expirationMonth,
    expirationYear,
    label
}: PaymentCardPreviewProps) {
    const expiration = expirationMonth && expirationYear
        ? `${expirationMonth}/${expirationYear.slice(-2)}`
        : 'MM/AA';

    return (
        <div className={styles.paymentCardPreview} role="img" aria-label={label}>
            <div className={styles.cardTopRow}>
                <span className={styles.cardBrand}>POST</span>
                <FaWifi aria-hidden="true" />
            </div>

            <div className={styles.cardBottomRow}>
                <div className={styles.cardDetails}>
                    <span className={styles.cardholderPreview}>
                        {cardholder.trim() || 'NOMBRE DEL TITULAR'}
                    </span>
                    <span className={styles.cardNumberPreview}>
                        {getMaskedCardNumber(lastFourDigits)}
                    </span>
                </div>
                <div className={styles.cardExpirationPreview}>
                    <span>VENCE</span>
                    <strong>{expiration}</strong>
                </div>
                <span className={styles.cardNetworkMark} aria-hidden="true">
                    <span />
                    <span />
                </span>
            </div>
        </div>
    );
}