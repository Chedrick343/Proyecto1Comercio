import type { FormEvent } from 'react';
import { COSTA_RICAN_PROVINCES } from './checkoutTypes';
import type {
    ShippingDetails,
    ShippingFieldErrors
} from './checkoutTypes';

import styles from './CheckoutEntryPage.module.css';

interface ShippingInformationFormProps {
    details: ShippingDetails;
    errors: ShippingFieldErrors;
    onDetailsChange: (field: keyof ShippingDetails, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ShippingInformationForm({
    details,
    errors,
    onDetailsChange,
    onSubmit
}: ShippingInformationFormProps) {
    const fieldClassName = (field: keyof ShippingDetails) =>
        errors[field]
            ? `${styles.formControl} ${styles.formControlInvalid}`
            : styles.formControl;

    return (
        <form className={styles.formPanel} noValidate onSubmit={onSubmit}>
            <div className={styles.panelHeader}>
                <h2 id="shipping-heading">Información de entrega</h2>
                <span>Los campos marcados con * son obligatorios</span>
            </div>

            {Object.keys(errors).length > 0 && (
                <p className={styles.validationSummary} role="alert">
                    Revisa los campos indicados antes de continuar.
                </p>
            )}

            <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label htmlFor="checkout-full-name">Nombre completo *</label>
                    <input
                        id="checkout-full-name"
                        className={fieldClassName('fullName')}
                        type="text"
                        autoComplete="name"
                        value={details.fullName}
                        aria-invalid={Boolean(errors.fullName)}
                        aria-describedby={errors.fullName ? 'checkout-full-name-error' : undefined}
                        onChange={(event) => onDetailsChange('fullName', event.target.value)}
                    />
                    {errors.fullName && (
                        <span id="checkout-full-name-error" className={styles.fieldError}>
                            {errors.fullName}
                        </span>
                    )}
                </div>

                <div className={styles.formField}>
                    <label htmlFor="checkout-email">Correo electrónico *</label>
                    <input
                        id="checkout-email"
                        className={fieldClassName('email')}
                        type="email"
                        autoComplete="email"
                        value={details.email}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'checkout-email-error' : undefined}
                        onChange={(event) => onDetailsChange('email', event.target.value)}
                    />
                    {errors.email && (
                        <span id="checkout-email-error" className={styles.fieldError}>
                            {errors.email}
                        </span>
                    )}
                </div>

                <div className={styles.formField}>
                    <label htmlFor="checkout-phone">Teléfono *</label>
                    <input
                        id="checkout-phone"
                        className={fieldClassName('phone')}
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        value={details.phone}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
                        onChange={(event) => onDetailsChange('phone', event.target.value)}
                    />
                    {errors.phone && (
                        <span id="checkout-phone-error" className={styles.fieldError}>
                            {errors.phone}
                        </span>
                    )}
                </div>

                <div className={styles.formField}>
                    <label htmlFor="checkout-province">Provincia *</label>
                    <select
                        id="checkout-province"
                        className={fieldClassName('province')}
                        value={details.province}
                        aria-invalid={Boolean(errors.province)}
                        aria-describedby={errors.province ? 'checkout-province-error' : undefined}
                        onChange={(event) => onDetailsChange('province', event.target.value)}
                    >
                        <option value="">Selecciona una provincia</option>
                        {COSTA_RICAN_PROVINCES.map((province) => (
                            <option key={province} value={province}>
                                {province}
                            </option>
                        ))}
                    </select>
                    {errors.province && (
                        <span id="checkout-province-error" className={styles.fieldError}>
                            {errors.province}
                        </span>
                    )}
                </div>

                <div className={styles.formField}>
                    <label htmlFor="checkout-canton">Cantón *</label>
                    <input
                        id="checkout-canton"
                        className={fieldClassName('canton')}
                        type="text"
                        autoComplete="address-level2"
                        value={details.canton}
                        aria-invalid={Boolean(errors.canton)}
                        aria-describedby={errors.canton ? 'checkout-canton-error' : undefined}
                        onChange={(event) => onDetailsChange('canton', event.target.value)}
                    />
                    {errors.canton && (
                        <span id="checkout-canton-error" className={styles.fieldError}>
                            {errors.canton}
                        </span>
                    )}
                </div>

                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label htmlFor="checkout-address">Dirección exacta *</label>
                    <textarea
                        id="checkout-address"
                        className={`${fieldClassName('address')} ${styles.addressInput}`}
                        autoComplete="street-address"
                        rows={3}
                        value={details.address}
                        aria-invalid={Boolean(errors.address)}
                        aria-describedby={errors.address ? 'checkout-address-error' : undefined}
                        onChange={(event) => onDetailsChange('address', event.target.value)}
                    />
                    {errors.address && (
                        <span id="checkout-address-error" className={styles.fieldError}>
                            {errors.address}
                        </span>
                    )}
                </div>

                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label htmlFor="checkout-notes">Indicaciones adicionales</label>
                    <textarea
                        id="checkout-notes"
                        className={`${styles.formControl} ${styles.addressInput}`}
                        rows={2}
                        value={details.deliveryNotes}
                        onChange={(event) => onDetailsChange('deliveryNotes', event.target.value)}
                    />
                </div>
            </div>

            <div className={styles.formActions}>
                <button className={styles.primaryAction} type="submit">
                    Revisar pedido
                </button>
            </div>
        </form>
    );
}