/**
 * @fileoverview Paso del checkout para indicar la dirección de entrega y la
 * sucursal de retiro o envío.
 */

import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHome, FaPlus } from 'react-icons/fa';

import { findBranchById } from '../../inventory/branches';
import type { SavedAddress } from '../../session/userTypes';
import BranchPicker from '../branch-picker/BranchPicker';
import type { BranchStatus } from '../branch-picker/BranchPickerDialog';
import ShippingAddressFields from './ShippingAddressFields';
import type {
    AddressChoice,
    ShippingDetails,
    ShippingFieldErrors
} from './checkoutTypes';

import styles from './CheckoutEntryPage.module.css';

/** Propiedades de ShippingInformationForm. */
interface ShippingInformationFormProps {
    /** Datos de la otra dirección, tal como se ingresan en el formulario. */
    details: ShippingDetails;
    errors: ShippingFieldErrors;
    /** Dirección guardada del usuario, o undefined si no tiene (como el invitado). */
    savedAddress?: SavedAddress;
    /** Dirección elegida: la guardada o una nueva. */
    addressChoice: AddressChoice;
    /** Disponibilidad del carrito en cada sucursal, para elegir la sucursal. */
    branchStatuses: BranchStatus[];
    /** Indica que se intentó continuar sin elegir una sucursal. */
    isBranchMissing: boolean;
    /** Se llama cuando cambia un campo de la otra dirección. */
    onDetailsChange: (field: keyof ShippingDetails, value: string) => void;
    onAddressChoiceChange: (choice: AddressChoice) => void;
    /** Se llama al enviar el formulario. */
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Muestra la dirección de entrega y la sucursal de retiro o envío. Si el
 * usuario tiene una dirección guardada, se ofrece como opción predeterminada,
 * igual que la tarjeta guardada en el paso de pago; si no, se muestra
 * directamente el formulario de dirección. La sucursal se elige solo en la
 * tarjeta de sucursal.
 *
 * @param props Propiedades del componente.
 * @return El formulario de entrega.
 */
export default function ShippingInformationForm({
    details,
    errors,
    savedAddress,
    addressChoice,
    branchStatuses,
    isBranchMissing,
    onDetailsChange,
    onAddressChoiceChange,
    onSubmit
}: ShippingInformationFormProps) {
    const { t } = useTranslation(['checkout', 'common']);

    const addressFields = (
        <ShippingAddressFields
            details={details}
            errors={errors}
            onDetailsChange={onDetailsChange}
        />
    );

    /**
     * Obtiene la clase de una opción de dirección según si está elegida.
     *
     * @param choice Opción a evaluar.
     * @return La clase de la opción.
     */
    const choiceClassName = (choice: AddressChoice) =>
        addressChoice === choice
            ? `${styles.paymentChoice} ${styles.paymentChoiceSelected}`
            : styles.paymentChoice;

    const savedAddressBranch = savedAddress?.defaultBranchId
        ? findBranchById(savedAddress.defaultBranchId)
        : undefined;

    return (
        <form className={styles.formPanel} noValidate onSubmit={onSubmit}>
            <div className={styles.panelHeader}>
                <h2 id="shipping-heading">{t('shipping.title')}</h2>
                <span>{t('form.requiredHint')}</span>
            </div>

            {(Object.keys(errors).length > 0 || isBranchMissing) && (
                <p className={styles.validationSummary} role="alert">
                    {t('form.validationSummary')}
                </p>
            )}

            {!savedAddress ? (
                addressFields
            ) : (
                <fieldset className={styles.paymentMethodList}>
                    <legend className={styles.visuallyHidden}>
                        {t('shipping.addressChoice.legend')}
                    </legend>

                    <div className={choiceClassName('SAVED_ADDRESS')}>
                        <label className={styles.paymentChoiceHeading}>
                            <input
                                type="radio"
                                name="address-choice"
                                value="SAVED_ADDRESS"
                                checked={addressChoice === 'SAVED_ADDRESS'}
                                onChange={() => onAddressChoiceChange('SAVED_ADDRESS')}
                            />
                            <FaHome aria-hidden="true" />
                            <span className={styles.paymentMethodText}>
                                <strong>
                                    {t('shipping.addressChoice.savedTitle')}
                                    <span className={styles.defaultBadge}>{t('common:branch.defaultTag')}</span>
                                </strong>
                                <span>{savedAddress.fullName} · {savedAddress.phone}</span>
                                <span>
                                    {savedAddress.address}, {savedAddress.canton}, {savedAddress.province}
                                </span>
                                <span>
                                    {savedAddressBranch
                                        ? t('shipping.addressChoice.defaultBranch', { branch: savedAddressBranch.name })
                                        : t('shipping.addressChoice.noDefaultBranch')}
                                </span>
                            </span>
                        </label>
                    </div>

                    <div className={choiceClassName('NEW_ADDRESS')}>
                        <label className={styles.paymentChoiceHeading}>
                            <input
                                type="radio"
                                name="address-choice"
                                value="NEW_ADDRESS"
                                checked={addressChoice === 'NEW_ADDRESS'}
                                onChange={() => onAddressChoiceChange('NEW_ADDRESS')}
                            />
                            <FaPlus aria-hidden="true" />
                            <span className={styles.paymentMethodText}>
                                <strong>{t('shipping.addressChoice.newTitle')}</strong>
                                <span>{t('shipping.addressChoice.newDescription')}</span>
                            </span>
                        </label>

                        {addressChoice === 'NEW_ADDRESS' && (
                            <div className={styles.newAddressDetails}>
                                {addressFields}
                            </div>
                        )}
                    </div>
                </fieldset>
            )}

            <div className={styles.branchField}>
                <BranchPicker
                    id="checkout-branch"
                    statuses={branchStatuses}
                    dialogDescription={t('common:branch.dialog.cartDescription')}
                    isRequired
                    hasError={isBranchMissing}
                    errorMessage={t('common:branch.required')}
                />
            </div>

            <div className={styles.formActions}>
                <button className={styles.primaryAction} type="submit">
                    {t('actions.reviewOrder')}
                </button>
            </div>
        </form>
    );
}
