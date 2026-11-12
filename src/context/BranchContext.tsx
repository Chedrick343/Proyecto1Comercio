/**
 * @fileoverview Estado global de la sucursal elegida en el checkout para
 * retirar o despachar el pedido. La elección pertenece a quien la hizo (un
 * usuario o el invitado): al cambiar de sesión no se hereda la sucursal de la
 * cuenta anterior, sino que se usa la predeterminada de la nueva, si tiene una.
 */

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from 'react';

import { findBranchById, type Branch } from '../inventory/branches';
import type { User } from '../session/userTypes';
import { useSession } from './SessionContext';

/** Clave de localStorage donde se guarda la sucursal elegida. */
const BRANCH_STORAGE_KEY = 'selected-branch-v2';

/** Dueño de la elección cuando nadie ha iniciado sesión. */
const GUEST_OWNER_ID = 'GUEST';

/** Sucursal elegida y quién la eligió. */
interface BranchSelection {
    /** Identificador del usuario que eligió, o GUEST_OWNER_ID si fue el invitado. */
    ownerId: string;
    /** Sucursal elegida, o null si se quitó la selección. */
    branchId: string | null;
}

/**
 * Obtiene el dueño de la elección para el usuario actual.
 *
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @return El identificador del usuario, o GUEST_OWNER_ID.
 */
const getOwnerId = (user: User | null): string => user?.id ?? GUEST_OWNER_ID;

/**
 * Obtiene la sucursal predeterminada de un usuario: la de su dirección
 * guardada, si existe. El invitado no tiene sucursal predeterminada.
 *
 * @param user Usuario con sesión iniciada, o null si es un invitado.
 * @return El identificador de la sucursal, o null si no tiene una válida.
 */
function getDefaultBranchId(user: User | null): string | null {
    const defaultBranchId = user?.savedAddress?.defaultBranchId;

    if (defaultBranchId && findBranchById(defaultBranchId)) {
        return defaultBranchId;
    }

    return null;
}

/**
 * Recupera la última elección guardada en localStorage.
 *
 * @return La elección guardada, o null si no hay una o está dañada.
 */
function getInitialSelection(): BranchSelection | null {
    try {
        const storedSelection = localStorage.getItem(BRANCH_STORAGE_KEY);

        if (!storedSelection) {
            return null;
        }

        const parsedSelection = JSON.parse(storedSelection) as Partial<BranchSelection>;
        const hasValidBranch =
            parsedSelection.branchId === null ||
            (typeof parsedSelection.branchId === 'string' && findBranchById(parsedSelection.branchId));

        if (typeof parsedSelection.ownerId !== 'string' || !hasValidBranch) {
            return null;
        }

        return { ownerId: parsedSelection.ownerId, branchId: parsedSelection.branchId ?? null };
    } catch (error) {
        console.error('No se pudo recuperar la sucursal elegida:', error);
        return null;
    }
}

/** Valor que expone el contexto de sucursal. */
interface BranchContextType {
    /** Sucursal elegida, o null si el usuario todavía no eligió una. */
    selectedBranch: Branch | null;

    /** Cambia la sucursal elegida; con null se quita la selección. */
    selectBranch: (branchId: string | null) => void;
}

/** Contexto de sucursal; es undefined fuera de BranchProvider. */
const BranchContext = createContext<BranchContextType | undefined>(undefined);

/** Propiedades de BranchProvider. */
interface BranchProviderProps {
    children: ReactNode;
}

/**
 * Proveedor que mantiene la sucursal elegida y la persiste en localStorage.
 * Debe estar dentro de SessionProvider.
 *
 * @param props Propiedades del componente.
 * @param props.children Componentes que tendrán acceso al contexto.
 * @return El proveedor del contexto envolviendo a sus hijos.
 */
export function BranchProvider({ children }: BranchProviderProps) {
    const { currentUser } = useSession();
    const [selection, setSelection] = useState<BranchSelection | null>(getInitialSelection);

    const ownerId = getOwnerId(currentUser);
    const defaultBranchId = getDefaultBranchId(currentUser);

    // Si la última elección es de otra persona, se usa la predeterminada del usuario actual.
    const selectedBranchId = selection?.ownerId === ownerId ? selection.branchId : defaultBranchId;
    const selectedBranch = selectedBranchId ? findBranchById(selectedBranchId) ?? null : null;

    useEffect(() => {
        try {
            if (selection) {
                localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(selection));
            } else {
                localStorage.removeItem(BRANCH_STORAGE_KEY);
            }
        } catch (error) {
            console.error('No se pudo guardar la sucursal elegida:', error);
        }
    }, [selection]);

    useEffect(() => {
        console.log(
            `Sucursal activa para ${ownerId}: ${selectedBranchId ?? 'ninguna'}` +
            (selectedBranchId !== null && selectedBranchId === defaultBranchId ? ' (predeterminada).' : '.')
        );
    }, [ownerId, selectedBranchId, defaultBranchId]);

    const selectBranch = (branchId: string | null) => {
        if (branchId !== null && !findBranchById(branchId)) {
            console.error(`La sucursal ${branchId} no existe; se ignora la selección.`);
            return;
        }

        setSelection({ ownerId, branchId });
    };

    return (
        <BranchContext.Provider value={{ selectedBranch, selectBranch }}>
            {children}
        </BranchContext.Provider>
    );
}

/**
 * Da acceso a la sucursal elegida y a la operación para cambiarla.
 *
 * @return El valor del contexto de sucursal.
 * @throws {Error} Si se usa fuera de BranchProvider.
 */
export function useBranch() {
    const context = useContext(BranchContext);

    if (!context) {
        throw new Error('useBranch debe utilizarse dentro de BranchProvider');
    }

    return context;
}
