/**
 * @fileoverview Formulario de inicio de sesión con correo y contraseña.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import DemoAccountSelector from './DemoAccountSelector';
import { useLoginForm } from './useLoginForm';

import styles from './LoginPage.module.css';

/** Propiedades de LoginField. */
interface LoginFieldProps {
    id: string;
    label: string;
    type: 'email' | 'password';
    autoComplete: string;
    value: string;
    /** Mensaje de validación ya traducido, si el campo es inválido. */
    error?: string;
    placeholder?: string;
    onChange: (value: string) => void;
}

/**
 * Muestra un campo del formulario con su etiqueta y su mensaje de error.
 *
 * @param props Propiedades del componente.
 * @return El campo del formulario.
 */
function LoginField({
    id,
    label,
    type,
    autoComplete,
    value,
    error,
    placeholder,
    onChange
}: LoginFieldProps) {
    const errorId = `${id}-error`;

    return (
        <div className={styles.field}>
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                className={error ? `${styles.input} ${styles.inputInvalid}` : styles.input}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                value={value}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => onChange(event.target.value)}
            />
            {error && (
                <span id={errorId} className={styles.fieldError}>
                    {error}
                </span>
            )}
        </div>
    );
}

/**
 * Muestra el formulario de inicio de sesión con el selector de cuentas de
 * prueba y la opción de seguir como invitado. Los errores de autenticación se
 * anuncian como alerta.
 *
 * @return El formulario de inicio de sesión.
 */
export default function LoginForm() {
    const { t } = useTranslation('auth');
    const {
        credentials,
        fieldErrors,
        authError,
        isSubmitting,
        updateField,
        fillCredentials,
        submit
    } = useLoginForm();

    return (
        <form className={styles.form} onSubmit={submit} noValidate>
            <header className={styles.formHeader}>
                <p className={styles.eyebrow}>{t('login.eyebrow')}</p>
                <h1>{t('login.title')}</h1>
                <p className={styles.description}>{t('login.description')}</p>
            </header>

            <LoginField
                id="login-email"
                label={t('login.fields.email')}
                type="email"
                autoComplete="email"
                placeholder={t('login.fields.emailPlaceholder')}
                value={credentials.email}
                error={fieldErrors.email && t(`validation.${fieldErrors.email}`)}
                onChange={(value) => updateField('email', value)}
            />

            <LoginField
                id="login-password"
                label={t('login.fields.password')}
                type="password"
                autoComplete="current-password"
                value={credentials.password}
                error={fieldErrors.password && t(`validation.${fieldErrors.password}`)}
                onChange={(value) => updateField('password', value)}
            />

            {authError && (
                <p className={styles.authError} role="alert">
                    {t(`errors.${authError}`)}
                </p>
            )}

            <button type="submit" className={styles.primaryAction} disabled={isSubmitting}>
                {isSubmitting ? t('login.submitting') : t('login.submit')}
            </button>

            <p className={styles.separator}>
                <span>{t('login.separator')}</span>
            </p>

            <Link to="/" className={styles.secondaryAction}>
                {t('login.continueAsGuest')}
            </Link>
            <p className={styles.guestNotice}>{t('login.guestNotice')}</p>

            <DemoAccountSelector
                credentials={credentials}
                disabled={isSubmitting}
                onSelect={fillCredentials}
            />
        </form>
    );
}
