export const CATALOG_QUERY_PARAM = 'q';
export const CATALOG_PAGE_PARAM = 'pagina';

const FIRST_PAGE = 1;

export const readCatalogQuery = (params: URLSearchParams): string =>
    params.get(CATALOG_QUERY_PARAM) ?? '';

export function readCatalogPage(params: URLSearchParams): number {
    const page = Number(params.get(CATALOG_PAGE_PARAM));

    return Number.isInteger(page) && page >= FIRST_PAGE ? page : FIRST_PAGE;
}

// Page 1 is the default, so it is left out of the URL to keep links clean.
export const formatCatalogPageParam = (page: number): string | null =>
    page > FIRST_PAGE ? String(page) : null;

export function withCatalogPage(params: URLSearchParams, page: number): URLSearchParams {
    const nextParams = new URLSearchParams(params);
    const pageParam = formatCatalogPageParam(page);

    if (pageParam) {
        nextParams.set(CATALOG_PAGE_PARAM, pageParam);
    } else {
        nextParams.delete(CATALOG_PAGE_PARAM);
    }

    return nextParams;
}

// A new search always starts on the first page.
export function withCatalogQuery(params: URLSearchParams, query: string): URLSearchParams {
    const nextParams = withCatalogPage(params, FIRST_PAGE);
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
        nextParams.set(CATALOG_QUERY_PARAM, trimmedQuery);
    } else {
        nextParams.delete(CATALOG_QUERY_PARAM);
    }

    return nextParams;
}
