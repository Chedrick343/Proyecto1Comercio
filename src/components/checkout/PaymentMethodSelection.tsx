import type { FormEvent } from 'react';
import { FaPlus } from 'react-icons/fa';

import PaymentCardPreview from './PaymentCardPreview';
import type {
    NewPaymentCard,
    PaymentCardErrors,
    PaymentMethod,
    SavedPaymentCard
} from './paymentCard';
import styles from './CheckoutEntryPage.module.css';

interface PaymentMethodSelectionProps {
    selectedMethod: PaymentMethod;
    savedCard: SavedPaymentCard;
    newCard: NewPaymentCard;
    errors: PaymentCardErrors;
    onMethodChange: (method: PaymentMethod) => void;
    onCardChange: (field: keyof NewPaymentCard, value: string) => void;
    onBack: () => void;
    onContinue: (event: FormEvent<HTMLFormElement>) => void;
}

const expirationYears = Array.from(
    { length: 11 },
    (_, yearOffset) => String(new Date().getFullYear() + yearOffset)
);

export default function PaymentMethodSelection({
    selectedMethod,
    savedCard,
    newCard,
    errors,
    onMethodChange,
    onCardChange,
    onBack,
    onContinue
}: PaymentMethodSelectionProps) {
    const newCardLastFour = newCard.cardNumber.replace(/\D/g, '').slice(-4);

    return (
        <form className={styles.formPanel} onSubmit={onContinue}>
            <div className={styles.panelHeader}>
                <h2 id="payment-method-heading">Método de pago</h2>
                <span>Usa tu tarjeta guardada o agrega una nueva.</span>
            </div>

            <fieldset className={styles.paymentMethodList}>
                <legend className={styles.visuallyHidden}>
                    Selecciona la tarjeta que deseas usar
                </legend>

                <div
                    className={
                        selectedMethod === 'SAVED_CARD'
                            ? `${styles.paymentChoice} ${styles.paymentChoiceSelected}`
                            : styles.paymentChoice
                    }
                >
                    <label className={styles.paymentChoiceHeading}>
                        <input
                            type="radio"
                            name="payment-method"
                            value="SAVED_CARD"
                            checked={selectedMethod === 'SAVED_CARD'}
                            onChange={() => onMethodChange('SAVED_CARD')}
                        />
                        <span className={styles.paymentMethodText}>
                            <strong>Tarjeta predeterminada</strong>
                            <span>{savedCard.brand} terminada en {savedCard.lastFourDigits}</span>
                        </span>
                    </label>

                </div>

                <div
                    className={
                        selectedMethod === 'NEW_CARD'
                            ? `${styles.paymentChoice} ${styles.paymentChoiceSelected}`
                            : styles.paymentChoice
                    }
                >
                    <label className={styles.paymentChoiceHeading}>
                        <input
                            type="radio"
                            name="payment-method"
                            value="NEW_CARD"
                            checked={selectedMethod === 'NEW_CARD'}
                            onChange={() => onMethodChange('NEW_CARD')}
                        />
                        <FaPlus aria-hidden="true" />
                        <span className={styles.paymentMethodText}>
                            <strong>Usar otra tarjeta</strong>
                            <span>Ingresa los datos de la tarjeta para esta compra.</span>
                        </span>
                    </label>

                    {selectedMethod === 'NEW_CARD' && (
                        <div className={styles.newCardDetails}>
                            <PaymentCardPreview
                                cardholder={newCard.cardholder}
                                lastFourDigits={newCardLastFour}
                                expirationMonth={newCard.expirationMonth}
                                expirationYear={newCard.expirationYear}
                                label="Vista previa de la nueva tarjeta"
                            />

                            <div className={styles.paymentFields}>
                                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                                    <label htmlFor="payment-cardholder">Nombre en la tarjeta *</label>
                                    <input
                                        id="payment-cardholder"
                                        className={errors.cardholder
                                            ? `${styles.formControl} ${styles.formControlInvalid}`
                                            : styles.formControl}
                                        autoComplete="cc-name"
                                        value={newCard.cardholder}
                                        aria-invalid={Boolean(errors.cardholder)}
                                        aria-describedby={errors.cardholder ? 'payment-cardholder-error' : undefined}
                                        onChange={(event) => onCardChange('cardholder', event.target.value)}
                                    />
                                    {errors.cardholder && (
                                        <span id="payment-cardholder-error" className={styles.fieldError}>
                                            {errors.cardholder}
                                        </span>
                                    )}
                                </div>

                                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                                    <label htmlFor="payment-card-number">Número de tarjeta *</label>
                                    <input
                                        id="payment-card-number"
                                        className={errors.cardNumber
                                            ? `${styles.formControl} ${styles.formControlInvalid}`
                                            : styles.formControl}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="cc-number"
                                        maxLength={23}
                                        value={newCard.cardNumber}
                                        aria-invalid={Boolean(errors.cardNumber)}
                                        aria-describedby={errors.cardNumber ? 'payment-card-number-error' : undefined}
                                        onChange={(event) => onCardChange('cardNumber', event.target.value)}
                                    />
                                    {errors.cardNumber && (
                                        <span id="payment-card-number-error" className={styles.fieldError}>
                                            {errors.cardNumber}
                                        </span>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label htmlFor="payment-expiration-month">Mes *</label>
                                    <select
                                        id="payment-expiration-month"
                                        className={errors.expirationMonth
                                            ? `${styles.formControl} ${styles.formControlInvalid}`
                                            : styles.formControl}
                                        autoComplete="cc-exp-month"
                                        value={newCard.expirationMonth}
                                        aria-invalid={Boolean(errors.expirationMonth)}
                                        aria-describedby={errors.expirationMonth ? 'payment-expiration-error' : undefined}
                                        onChange={(event) => onCardChange('expirationMonth', event.target.value)}
                                    >
                                        <option value="">MM</option>
                                        {Array.from({ length: 12 }, (_, monthIndex) => {
                                            const month = String(monthIndex + 1).padStart(2, '0');
                                            return <option key={month} value={month}>{month}</option>;
                                        })}
                                    </select>
                                </div>

                                <div className={styles.formField}>
                                    <label htmlFor="payment-expiration-year">Año *</label>
                                    <select
                                        id="payment-expiration-year"
                                        className={errors.expirationMonth
                                            ? `${styles.formControl} ${styles.formControlInvalid}`
                                            : styles.formControl}
                                        autoComplete="cc-exp-year"
                                        value={newCard.expirationYear}
                                        aria-invalid={Boolean(errors.expirationMonth)}
                                        aria-describedby={errors.expirationMonth ? 'payment-expiration-error' : undefined}
                                        onChange={(event) => onCardChange('expirationYear', event.target.value)}
                                    >
                                        <option value="">AAAA</option>
                                        {expirationYears.map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formField}>
                                    <label htmlFor="payment-security-code">CVV *</label>
                                    <input
                                        id="payment-security-code"
                                        className={errors.securityCode
                                            ? `${styles.formControl} ${styles.formControlInvalid}`
                                            : styles.formControl}
                                        type="password"
                                        inputMode="numeric"
                                        autoComplete="cc-csc"
                                        maxLength={4}
                                        value={newCard.securityCode}
                                        aria-invalid={Boolean(errors.securityCode)}
                                        aria-describedby={errors.securityCode ? 'payment-security-code-error' : undefined}
                                        onChange={(event) => onCardChange('securityCode', event.target.value)}
                                    />
                                    {errors.securityCode && (
                                        <span id="payment-security-code-error" className={styles.fieldError}>
                                            {errors.securityCode}
                                        </span>
                                    )}
                                </div>

                                {errors.expirationMonth && (
                                    <span id="payment-expiration-error" className={styles.fieldError}>
                                        {errors.expirationMonth}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </fieldset>

            <div className={styles.formActions}>
                <button
                    className={styles.secondaryAction}
                    type="button"
                    onClick={onBack}
                >
                    Volver a entrega
                </button>
                <button className={styles.primaryAction} type="submit">
                    Revisar pedido
                </button>
            </div>
        </form>
    );
}