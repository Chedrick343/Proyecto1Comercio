/**
 * @fileoverview Estado global de la sesión: el usuario que inició sesión, si hay uno.
 */

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from 'react';

import { getPermissions } from '../session/permissions';
import { isUser, type User } from '../session/userTypes';

/** Clave de localStorage donde se guarda el usuario con sesión iniciada. */
const SESSION_STORAGE_KEY = 'session-v1';

/**
 * Recupera la sesión guardada en localStorage.
 *
 * @return El usuario guardado, o null si no hay sesión o los datos están dañados.
 */
function getInitialUser(): User | null {
    try {
        const storedUser = localStorage.getItem(SESSION_STORAGE_KEY);

        if (!storedUser) {
            return null;
        }

        const parsedUser: unknown = JSON.parse(storedUser);
        return isUser(parsedUser) ? parsedUser : null;
    } catch (error) {
        console.error('No se pudo recuperar la sesión:', error);
        return null;
    }
}

/** Valor que expone el contexto de sesión. */
interface SessionContextType {
    /** Usuario con sesión iniciada, o null si se navega como invitado. */
    currentUser: User | null;

    /** Inicia la sesión de un usuario ya autenticado. */
    startSession: (user: User) => void;

    /** Cierra la sesión y vuelve al modo invitado. */
    endSession: () => void;
}

/** Contexto de sesión; es undefined fuera de SessionProvider. */
const SessionContext = createContext<SessionContextType | undefined>(undefined);

/** Propiedades de SessionProvider. */
interface SessionProviderProps {
    children: ReactNode;
}

/**
 * Proveedor que mantiene la sesión activa y la persiste en localStorage.
 *
 * @param props Propiedades del componente.
 * @param props.children Componentes que tendrán acceso al contexto.
 * @return El proveedor del contexto envolviendo a sus hijos.
 */
export function SessionProvider({ children }: SessionProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);

    useEffect(() => {
        try {
            if (currentUser) {
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
            } else {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            }
        } catch (error) {
            console.error('No se pudo guardar la sesión:', error);
        }
    }, [currentUser]);

    const startSession = (user: User) => {
        console.log(`Sesión iniciada: ${user.email} con rol ${user.role}.`);
        console.log('Permisos del usuario:', getPermissions(user));
        setCurrentUser(user);
    };

    const endSession = () => {
        console.log(`Sesión cerrada: ${currentUser?.email ?? 'sin usuario'}. Ahora se navega como invitado.`);
        setCurrentUser(null);
    };

    return (
        <SessionContext.Provider value={{ currentUser, startSession, endSession }}>
            {children}
        </SessionContext.Provider>
    );
}

/**
 * Da acceso a la sesión activa y a sus operaciones.
 *
 * @return El valor del contexto de sesión.
 * @throws {Error} Si se usa fuera de SessionProvider.
 */
export function useSession() {
    const context = useContext(SessionContext);

    if (!context) {
        throw new Error('useSession debe utilizarse dentro de SessionProvider');
    }

    return context;
}
