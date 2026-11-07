/**
 * @fileoverview Estado de navegación para pedir que la barra de búsqueda reciba el foco.
 */

/** Estado de navegación que solicita enfocar la búsqueda. */
interface SearchFocusState {
    focusSearch: true;
}

/** Estado a pasar al navegar para enfocar la búsqueda al llegar. */
export const FOCUS_SEARCH_STATE: SearchFocusState = { focusSearch: true };

/**
 * Indica si la navegación pidió enfocar la barra de búsqueda.
 *
 * @param locationState Estado de navegación de React Router.
 * @return Verdadero si el estado es FOCUS_SEARCH_STATE.
 */
export const isSearchFocusRequested = (locationState: unknown): boolean =>
    typeof locationState === 'object' &&
    locationState !== null &&
    (locationState as Partial<SearchFocusState>).focusSearch === true;
