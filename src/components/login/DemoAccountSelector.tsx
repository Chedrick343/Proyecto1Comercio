/**
 * @fileoverview Accesos discretos a las cuentas de prueba del login.
 */

import { useTranslation } from 'react-i18next';

import type { LoginCredentials } from '../../session/authService';
import { DEMO_ACCOUNTS, findDemoAccount } from '../../session/demoAccounts';

import styles from './DemoAccountSelector.module.css';

/** Propiedades de DemoAccountSelector. */
interface DemoAccountSelectorProps {
    /** Credenciales actuales del formulario; definen qué cuenta aparece marcada. */
    credentials: LoginCredentials;
    disabled: boolean;
    /** Se llama con las credenciales de la cuenta elegida. */
    onSelect: (credentials: LoginCredentials) => void;
}

/**
 * Muestra una línea de enlaces que autocompletan el correo y la contraseña de
 * cada cuenta de prueba. La cuenta marcada se deriva de las credenciales, así
 * que se desmarca sola si el usuario edita los campos.
 *
 * @param props Propiedades del componente.
 * @return El grupo de accesos a las cuentas de prueba.
 */
export default function DemoAccountSelector({
    credentials,
    disabled,
    onSelect
}: DemoAccountSelectorProps) {
    const { t } = useTranslation('auth');
    const selectedAccountId = findDemoAccount(credentials)?.id;

    return (
        <div className={styles.demoAccounts} role="group" aria-labelledby="demo-accounts-label">
            <span id="demo-accounts-label">{t('demo.label')}</span>

            {DEMO_ACCOUNTS.map((account) => (
                <button
                    key={account.id}
                    type="button"
                    className={styles.account}
                    aria-pressed={account.id === selectedAccountId}
                    aria-label={t('demo.fillAs', { account: t(`demo.accounts.${account.id}.full`) })}
                    disabled={disabled}
                    onClick={() => onSelect(account.credentials)}
                >
                    {t(`demo.accounts.${account.id}.short`)}
                </button>
            ))}
        </div>
    );
}
