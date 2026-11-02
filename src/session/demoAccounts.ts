/**
 * @fileoverview Cuentas de prueba para evaluar cada rol desde el login. Las
 * contraseñas son públicas a propósito (también están en el README): solo
 * sirven para la autenticación simulada.
 */

import type { LoginCredentials } from './authService';

/** Identificador de una cuenta de prueba; coincide con su clave de traducción. */
export type DemoAccountId = 'B2C' | 'B2B' | 'ADMIN' | 'INVALID_ROLE';

/** Cuenta de prueba con las credenciales que se autocompletan al elegirla. */
export interface DemoAccount {
    id: DemoAccountId;
    credentials: LoginCredentials;
}

/**
 * Cuentas de prueba, en el orden en que se muestran. INVALID_ROLE existe en el
 * índice con un rol no admitido, para comprobar que no puede iniciar sesión.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
    { id: 'B2C', credentials: { email: 'cliente@post.cr', password: 'Cliente2026!' } },
    { id: 'B2B', credentials: { email: 'compras@joyeriaaurora.cr', password: 'Empresa2026!' } },
    { id: 'ADMIN', credentials: { email: 'admin@post.cr', password: 'Admin2026!' } },
    { id: 'INVALID_ROLE', credentials: { email: 'sinrol@post.cr', password: 'SinRol2026!' } }
];

/**
 * Busca la cuenta de prueba cuyas credenciales coinciden exactamente con las
 * ingresadas.
 *
 * @param credentials Credenciales del formulario.
 * @return La cuenta que coincide, o undefined si el usuario escribió otras.
 */
export const findDemoAccount = (credentials: LoginCredentials): DemoAccount | undefined =>
    DEMO_ACCOUNTS.find(
        (account) =>
            account.credentials.email === credentials.email &&
            account.credentials.password === credentials.password
    );
