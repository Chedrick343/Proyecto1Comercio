/**
 * @fileoverview Permite volver al catálogo conservando la búsqueda y los filtros que
 * el usuario tenía antes de abrir un producto.
 */

import type { Location } from 'react-router-dom';

/** Estado de navegación que recuerda la búsqueda del catálogo. */
interface CatalogReturnState {
    /** Parte de búsqueda de la URL del catálogo (por ejemplo, "?q=anillo"). */
    catalogSearch: string;
}

/**
 * Verifica si un estado de navegación contiene la búsqueda del catálogo.
 *
 * @param state Estado de navegación de React Router.
 * @return Verdadero si el estado incluye una búsqueda del catálogo.
 */
const isCatalogReturnState = (state: unknown): state is CatalogReturnState =>
    typeof state === 'object' &&
    state !== null &&
    typeof (state as CatalogReturnState).catalogSearch === 'string';

/**
 * Calcula el estado que deben llevar los enlaces hacia un producto. Desde el
 * catálogo recuerda la búsqueda actual; desde otras páginas reenvía la ya
 * recordada, para que los productos relacionados lleven a la misma búsqueda.
 *
 * @param location Ubicación actual del enrutador.
 * @return El estado a pasar en la navegación, o undefined si no hay búsqueda.
 */
export function getCatalogReturnState(location: Location): CatalogReturnState | undefined {
    if (location.pathname === '/') {
        return { catalogSearch: location.search };
    }

    return isCatalogReturnState(location.state) ? location.state : undefined;
}

/**
 * Obtiene la ruta del catálogo a la que se debe volver.
 *
 * @param locationState Estado de navegación de la página actual.
 * @return La ruta del catálogo con la búsqueda recordada, o "/" si no hay.
 */
export const getCatalogReturnPath = (locationState: unknown): string =>
    isCatalogReturnState(locationState) ? `/${locationState.catalogSearch}` : '/';
