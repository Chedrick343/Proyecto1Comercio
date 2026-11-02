/**
 * @fileoverview Permite volver a la página donde estaba el usuario después de
 * iniciar sesión.
 */

import type { Location } from 'react-router-dom';

/** Ruta de la página de inicio de sesión. */
export const LOGIN_PATH = '/login';

/** Estado de navegación que recuerda la página desde la que se abrió el login. */
interface LoginRedirectState {
    /** Ruta de origen, incluida su búsqueda (por ejemplo, "/producto/12?q=oro"). */
    from: string;
}

/**
 * Crea el estado que deben llevar los enlaces hacia el inicio de sesión.
 *
 * @param location Ubicación actual del enrutador.
 * @return El estado con la ruta actual como destino de regreso.
 */
export const createLoginRedirectState = (location: Location): LoginRedirectState => ({
    from: `${location.pathname}${location.search}`
});

/**
 * Obtiene la ruta a la que se debe ir después de iniciar sesión.
 *
 * @param locationState Estado de navegación de la página de inicio de sesión.
 * @return La ruta de origen, o "/" si no hay una o es el propio login.
 */
export function getLoginRedirectPath(locationState: unknown): string {
    const from = (locationState as Partial<LoginRedirectState> | null)?.from;

    return typeof from === 'string' && !from.startsWith(LOGIN_PATH) ? from : '/';
}
