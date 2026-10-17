import type { Location } from 'react-router-dom';

interface CatalogReturnState {
    catalogSearch: string;
}

const isCatalogReturnState = (state: unknown): state is CatalogReturnState =>
    typeof state === 'object' &&
    state !== null &&
    typeof (state as CatalogReturnState).catalogSearch === 'string';

// From the catalog it remembers the current search; from other pages it carries the
// remembered one forward, so related products still lead back to the same search.
export function getCatalogReturnState(location: Location): CatalogReturnState | undefined {
    if (location.pathname === '/') {
        return { catalogSearch: location.search };
    }

    return isCatalogReturnState(location.state) ? location.state : undefined;
}

export const getCatalogReturnPath = (locationState: unknown): string =>
    isCatalogReturnState(locationState) ? `/${locationState.catalogSearch}` : '/';
