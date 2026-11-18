/**
 * @fileoverview Hook para obtener el tipo de precio del usuario actual.
 */

import { useSession } from '../context/SessionContext';
import { getPriceTier, type PriceTier } from './customerPrice';

/**
 * Obtiene el tipo de precio que le corresponde al usuario con sesión
 * iniciada, o al invitado si no hay sesión.
 *
 * @return B2B para el cliente B2B, y B2C para todos los demás.
 */
export function usePriceTier(): PriceTier {
    const { currentUser } = useSession();
    return getPriceTier(currentUser);
}
