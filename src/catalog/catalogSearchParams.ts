import {
    MAX_PRICE,
    MIN_PRICE,
    type ProductFilters
} from '../utils/Products';

export const CATALOG_QUERY_PARAM = 'q';
export const CATALOG_PAGE_PARAM = 'pagina';
export const CATALOG_CATEGORY_PARAM = 'categoria';
export const CATALOG_MIN_PRICE_PARAM = 'precioMin';
export const CATALOG_MAX_PRICE_PARAM = 'precioMax';

const FIRST_PAGE = 1;

function readPriceParam(params: URLSearchParams, name: string, fallback: number): number {
    const rawValue = params.get(name);
    const value = Number(rawValue);

    if (rawValue === null || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(Math.max(value, MIN_PRICE), MAX_PRICE);
}

function setOrDeleteParam(params: URLSearchParams, name: string, value: string | null) {
    if (value === null) {
        params.delete(name);
    } else {
        params.set(name, value);
    }
}

export function readCatalogFilters(params: URLSearchParams): ProductFilters {
    return {
        search: '',
        categories: params.getAll(CATALOG_CATEGORY_PARAM),
        minPrice: readPriceParam(params, CATALOG_MIN_PRICE_PARAM, MIN_PRICE),
        maxPrice: readPriceParam(params, CATALOG_MAX_PRICE_PARAM, MAX_PRICE)
    };
}

// Changing filters always goes back to the first page; default values stay out of the URL.
export function withCatalogFilters(params: URLSearchParams, filters: ProductFilters): URLSearchParams {
    const nextParams = withCatalogPage(params, FIRST_PAGE);

    nextParams.delete(CATALOG_CATEGORY_PARAM);
    filters.categories.forEach((category) => nextParams.append(CATALOG_CATEGORY_PARAM, category));

    setOrDeleteParam(
        nextParams,
        CATALOG_MIN_PRICE_PARAM,
        filters.minPrice !== MIN_PRICE ? String(filters.minPrice) : null
    );
    setOrDeleteParam(
        nextParams,
        CATALOG_MAX_PRICE_PARAM,
        filters.maxPrice !== MAX_PRICE ? String(filters.maxPrice) : null
    );

    return nextParams;
}

export function getCatalogCategoryPath(category: string): string {
    const params = new URLSearchParams();
    params.append(CATALOG_CATEGORY_PARAM, category);

    return `/?${params.toString()}`;
}

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

export function getCatalogSearchPath(query: string): string {
    const params = withCatalogQuery(new URLSearchParams(), query).toString();

    return params ? `/?${params}` : '/';
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
