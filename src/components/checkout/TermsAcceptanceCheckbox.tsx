/**
 * @fileoverview Casilla para aceptar los términos y condiciones antes de pagar.
 */

import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import PolicyDocument from '../policies/PolicyDocument';

import styles from './TermsAcceptanceCheckbox.module.css';

/** Propiedades de TermsAcceptanceCheckbox. */
interface TermsAcceptanceCheckboxProps {
    checked: boolean;
    /** Muestra el error de términos no aceptados. */
    showError: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
}

/**
 * Muestra la casilla de aceptación con un enlace que abre los términos en
 * un modal.
 *
 * @param props Propiedades del componente.
 * @return La casilla con su mensaje de error.
 */
export default function TermsAcceptanceCheckbox({
    checked,
    showError,
    disabled,
    onChange
}: TermsAcceptanceCheckboxProps) {
    const { t } = useTranslation('checkout');
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const closeTerms = useCallback(() => setIsTermsOpen(false), []);

    return (
        <div className={styles.termsAcceptance}>
            <label
                className={
                    showError
                        ? `${styles.option} ${styles.optionInvalid}`
                        : styles.option
                }
            >
                <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    aria-invalid={showError}
                    aria-describedby={showError ? 'checkout-terms-error' : undefined}
                    onChange={(event) => onChange(event.target.checked)}
                />
                <span>
                    <Trans
                        t={t}
                        i18nKey="terms.acceptLabel"
                        components={{
                            termsLink: (
                                <button
                                    type="button"
                                    className={styles.termsLink}
                                    onClick={() => setIsTermsOpen(true)}
                                />
                            )
                        }}
                    />
                </span>
            </label>

            {showError && (
                <span id="checkout-terms-error" className={styles.fieldError} role="alert">
                    {t('validation.termsRequired')}
                </span>
            )}

            <PolicyDocument policy="terms" isOpen={isTermsOpen} onClose={closeTerms} />
        </div>
    );
}
