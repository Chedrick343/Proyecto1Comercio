/**
 * @fileoverview Lectura y escritura del estado del catálogo (búsqueda, filtros y página)
 * en los parámetros de la URL, para que los enlaces sean compartibles.
 */

import {
    MAX_PRICE,
    MIN_PRICE,
    type ProductFilters
} from '../utils/Products';

/** Parámetro de URL con el texto de búsqueda. */
export const CATALOG_QUERY_PARAM = 'q';
/** Parámetro de URL con el número de página. */
export const CATALOG_PAGE_PARAM = 'pagina';
/** Parámetro de URL, repetible, con cada categoría seleccionada. */
export const CATALOG_CATEGORY_PARAM = 'categoria';
/** Parámetro de URL con el precio mínimo. */
export const CATALOG_MIN_PRICE_PARAM = 'precioMin';
/** Parámetro de URL con el precio máximo. */
export const CATALOG_MAX_PRICE_PARAM = 'precioMax';

/** Número de la primera página del catálogo. */
const FIRST_PAGE = 1;

/**
 * Lee un precio de la URL y lo limita al rango permitido.
 *
 * @param params Parámetros de la URL.
 * @param name Nombre del parámetro a leer.
 * @param fallback Valor a usar si el parámetro falta o no es numérico.
 * @return El precio leído, limitado entre MIN_PRICE y MAX_PRICE.
 */
function readPriceParam(params: URLSearchParams, name: string, fallback: number): number {
    const rawValue = params.get(name);
    const value = Number(rawValue);

    if (rawValue === null || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(Math.max(value, MIN_PRICE), MAX_PRICE);
}

/**
 * Asigna un parámetro de URL, o lo elimina si el valor es nulo.
 *
 * @param params Parámetros a modificar.
 * @param name Nombre del parámetro.
 * @param value Valor a asignar, o null para eliminarlo.
 */
function setOrDeleteParam(params: URLSearchParams, name: string, value: string | null) {
    if (value === null) {
        params.delete(name);
    } else {
        params.set(name, value);
    }
}

/**
 * Lee los filtros del catálogo desde la URL.
 *
 * @param params Parámetros de la URL.
 * @return Los filtros de categoría y precio; la búsqueda se lee aparte.
 */
export function readCatalogFilters(params: URLSearchParams): ProductFilters {
    return {
        search: '',
        categories: params.getAll(CATALOG_CATEGORY_PARAM),
        minPrice: readPriceParam(params, CATALOG_MIN_PRICE_PARAM, MIN_PRICE),
        maxPrice: readPriceParam(params, CATALOG_MAX_PRICE_PARAM, MAX_PRICE)
    };
}

/**
 * Aplica filtros a los parámetros de la URL. Cambiar filtros siempre vuelve
 * a la primera página, y los valores por defecto se omiten de la URL.
 *
 * @param params Parámetros actuales.
 * @param filters Filtros a aplicar.
 * @return Una copia de los parámetros con los filtros aplicados.
 */
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

/**
 * Construye la ruta del catálogo filtrada por una sola categoría.
 *
 * @param category Categoría a filtrar.
 * @return La ruta del catálogo con la categoría como parámetro.
 */
export function getCatalogCategoryPath(category: string): string {
    const params = new URLSearchParams();
    params.append(CATALOG_CATEGORY_PARAM, category);

    return `/?${params.toString()}`;
}

/**
 * Lee el texto de búsqueda desde la URL.
 *
 * @param params Parámetros de la URL.
 * @return El texto buscado, o una cadena vacía si no hay búsqueda.
 */
export const readCatalogQuery = (params: URLSearchParams): string =>
    params.get(CATALOG_QUERY_PARAM) ?? '';

/**
 * Lee el número de página desde la URL.
 *
 * @param params Parámetros de la URL.
 * @return La página indicada, o la primera si el valor no es válido.
 */
export function readCatalogPage(params: URLSearchParams): number {
    const page = Number(params.get(CATALOG_PAGE_PARAM));

    return Number.isInteger(page) && page >= FIRST_PAGE ? page : FIRST_PAGE;
}

/**
 * Convierte un número de página en el valor de su parámetro. La página 1 es
 * la predeterminada, así que se omite para mantener los enlaces limpios.
 *
 * @param page Número de página.
 * @return El valor del parámetro, o null para la primera página.
 */
export const formatCatalogPageParam = (page: number): string | null =>
    page > FIRST_PAGE ? String(page) : null;

/**
 * Asigna el número de página en los parámetros de la URL.
 *
 * @param params Parámetros actuales.
 * @param page Página a asignar.
 * @return Una copia de los parámetros con la página aplicada.
 */
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

/**
 * Construye la ruta del catálogo para una búsqueda.
 *
 * @param query Texto a buscar.
 * @return La ruta del catálogo con la búsqueda, o "/" si está vacía.
 */
export function getCatalogSearchPath(query: string): string {
    const params = withCatalogQuery(new URLSearchParams(), query).toString();

    return params ? `/?${params}` : '/';
}

/**
 * Asigna el texto de búsqueda en los parámetros de la URL. Una búsqueda
 * nueva siempre empieza en la primera página.
 *
 * @param params Parámetros actuales.
 * @param query Texto a buscar; se recortan los espacios de los extremos.
 * @return Una copia de los parámetros con la búsqueda aplicada.
 */
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
