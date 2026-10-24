import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import PolicyDocument from '../policies/PolicyDocument';

import styles from './TermsAcceptanceCheckbox.module.css';

interface TermsAcceptanceCheckboxProps {
    checked: boolean;
    showError: boolean;
    disabled: boolean;
    onChange: (checked: boolean) => void;
}

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
