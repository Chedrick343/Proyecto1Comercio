import { FaWifi } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation(['checkout', 'common']);
    const expiration = expirationMonth && expirationYear
        ? `${expirationMonth}/${expirationYear.slice(-2)}`
        : t('checkout:cardPreview.expirationPlaceholder');

    return (
        <div className={styles.paymentCardPreview} role="img" aria-label={label}>
            <div className={styles.cardTopRow}>
                <span className={styles.cardBrand}>{t('common:brand')}</span>
                <FaWifi aria-hidden="true" />
            </div>

            <div className={styles.cardBottomRow}>
                <div className={styles.cardDetails}>
                    <span className={styles.cardholderPreview}>
                        {cardholder.trim() || t('checkout:cardPreview.cardholderPlaceholder')}
                    </span>
                    <span className={styles.cardNumberPreview}>
                        {getMaskedCardNumber(lastFourDigits)}
                    </span>
                </div>
                <div className={styles.cardExpirationPreview}>
                    <span>{t('checkout:cardPreview.expires')}</span>
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