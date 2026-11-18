/**
 * @fileoverview Autenticación simulada contra el índice de usuarios de Algolia.
 * No es un sistema de autenticación real: la verificación ocurre en el
 * navegador y solo representa los usuarios definidos para la evaluación.
 */

import {
    AlgoliaRequestError,
    getAlgoliaObject,
    usersIndexName
} from '../utils/algolia';
import { hashPassword } from './passwordHash';
import {
    isCompany,
    isSavedAddress,
    isUserRole,
    type Company,
    type User
} from './userTypes';

/** Credenciales ingresadas en el formulario de inicio de sesión. */
export interface LoginCredentials {
    email: string;
    password: string;
}

/** Causa por la que no se pudo iniciar sesión. */
export type AuthErrorCode = 'invalidCredentials' | 'invalidRole' | 'unavailable';

/** Error lanzado cuando no se puede iniciar sesión. */
export class AuthError extends Error {
    /** Causa del error. */
    readonly code: AuthErrorCode;

    /** @param code Causa del error. */
    constructor(code: AuthErrorCode) {
        super(code);
        this.name = 'AuthError';
        this.code = code;
    }
}

/**
 * Usuario tal como se guarda en el índice. El rol no se tipa como UserRole
 * porque el índice podría contener un valor no admitido.
 */
interface UserRecord {
    /** Correo normalizado; es la clave del registro en el índice. */
    objectID: string;
    name: string;
    email: string;
    role: unknown;
    company?: Company;
    /** Dirección guardada; se revisa antes de usarla porque podría estar incompleta. */
    savedAddress?: unknown;
    /** Hash SHA-256 de la contraseña, en hexadecimal. */
    passwordHash: string;
}

/**
 * Normaliza un correo para usarlo como clave del índice de usuarios.
 *
 * @param email Correo ingresado.
 * @return El correo sin espacios en los extremos y en minúsculas.
 */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Verifica que un registro del índice tenga los campos de un usuario.
 *
 * @param hit Registro devuelto por Algolia.
 * @return Verdadero si el registro tiene la forma de UserRecord.
 */
const isUserRecord = (hit: unknown): hit is UserRecord => {
    const record = hit as Partial<UserRecord> | null;

    return (
        typeof record?.objectID === 'string' &&
        typeof record.name === 'string' &&
        typeof record.email === 'string' &&
        typeof record.passwordHash === 'string' &&
        (record.company === undefined || isCompany(record.company))
    );
};

/**
 * Busca un usuario en el índice por su correo.
 *
 * @param email Correo normalizado.
 * @return El registro del usuario, o null si no existe o está incompleto.
 * @throws {AuthError} Con código "unavailable" si no se pudo consultar Algolia.
 */
async function findUserRecord(email: string): Promise<UserRecord | null> {
    try {
        const hit = await getAlgoliaObject(usersIndexName, email);
        return isUserRecord(hit) ? hit : null;
    } catch (error) {
        throw error instanceof AlgoliaRequestError ? new AuthError('unavailable') : error;
    }
}

/**
 * Verifica las credenciales de un usuario. Un correo inexistente y una
 * contraseña incorrecta producen el mismo error, para no revelar qué cuentas
 * existen.
 *
 * @param credentials Correo y contraseña ingresados.
 * @return El usuario autenticado, sin datos de autenticación.
 * @throws {AuthError} Si las credenciales son incorrectas, el usuario no tiene
 *     un rol admitido o no se pudo consultar Algolia.
 */
export async function authenticate({ email, password }: LoginCredentials): Promise<User> {
    const [record, passwordHash] = await Promise.all([
        findUserRecord(normalizeEmail(email)),
        hashPassword(password)
    ]);

    if (!record || record.passwordHash !== passwordHash) {
        throw new AuthError('invalidCredentials');
    }

    if (!isUserRole(record.role)) {
        throw new AuthError('invalidRole');
    }

    // Una dirección incompleta no impide iniciar sesión; solo no se ofrece en el checkout.
    const savedAddress = isSavedAddress(record.savedAddress) ? record.savedAddress : undefined;

    if (record.savedAddress !== undefined && !savedAddress) {
        console.error(`La dirección guardada de ${record.objectID} está incompleta; se ignora.`);
    }

    return {
        id: record.objectID,
        name: record.name,
        email: record.email,
        role: record.role,
        company: record.company,
        savedAddress
    };
}
