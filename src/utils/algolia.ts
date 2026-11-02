/**
 * @fileoverview Acceso a los índices de Algolia: productos y usuarios.
 */

import { liteClient } from 'algoliasearch/lite';
import type { Product } from './Products';

/** Identificador de la aplicación de Algolia. */
const applicationId = import.meta.env.VITE_ALGOLIA_APPLICATION_ID;
/** Clave pública de Algolia, de solo búsqueda. */
const searchApiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
/** Nombre del índice de productos en Algolia. */
export const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME;
/** Nombre del índice de usuarios en Algolia. */
export const usersIndexName = import.meta.env.VITE_ALGOLIA_USERS_INDEX_NAME;

/** Cliente de búsqueda, o null si faltan las variables de entorno. */
export const searchClient = applicationId && searchApiKey
    ? liteClient(applicationId, searchApiKey)
    : null;

/**
 * Resultado de Algolia tal como llega: cualquier campo puede faltar y el
 * precio puede venir dentro de b2c o en la raíz.
 */
type AlgoliaProductHit = Omit<Partial<Product>, 'b2c' | 'b2b'> & {
    b2c?: Partial<Product['b2c']>;
    b2b?: Partial<Product['b2b']>;
    price?: number;
    currency?: string;
};

/**
 * Convierte un resultado de Algolia en un producto completo, rellenando los
 * campos faltantes con valores por defecto.
 *
 * @param hit Resultado devuelto por Algolia.
 * @return El producto con todos sus campos definidos.
 */
export function normalizeAlgoliaProduct(hit: unknown): Product {
    const productHit = hit as AlgoliaProductHit;
    const stockQuantity = productHit.stock_quantity ?? 0;
    const inStock = productHit.in_stock ?? stockQuantity > 0;
    const price = productHit.b2c?.price ?? productHit.price ?? 0;
    const currency = productHit.b2c?.currency ?? productHit.currency ?? 'CRC';

    return {
        objectID: productHit.objectID ?? productHit.sku ?? productHit.title ?? 'unknown-product',
        sku: productHit.sku ?? productHit.objectID ?? '',
        title: productHit.title ?? '',
        description: productHit.description ?? '',
        categories: productHit.categories ?? [],
        brand: productHit.brand ?? '',
        b2c: {
            enabled: productHit.b2c?.enabled ?? true,
            price,
            currency,
            available: productHit.b2c?.available ?? inStock
        },
        b2b: {
            enabled: productHit.b2b?.enabled ?? false,
            price: productHit.b2b?.price ?? price,
            currency: productHit.b2b?.currency ?? currency,
            minimumOrder: productHit.b2b?.minimumOrder ?? 1,
            businessDiscount: productHit.b2b?.businessDiscount ?? 0
        },
        locations: productHit.locations ?? [],
        in_stock: inStock,
        stock_quantity: stockQuantity,
        rating: productHit.rating ?? 0,
        image_url: productHit.image_url ?? '',
        facets: productHit.facets ?? {},
        tags: productHit.tags ?? [],
        active: productHit.active ?? true
    };
}

/**
 * Busca productos por texto en Algolia.
 *
 * @param query Texto a buscar.
 * @param hitsPerPage Cantidad máxima de resultados.
 * @return Los productos encontrados, o una lista vacía si Algolia no está configurado.
 */
export async function searchProductsByText(
    query: string,
    hitsPerPage: number
): Promise<Product[]> {
    if (!searchClient || !indexName) {
        return [];
    }

    const { results } = await searchClient.searchForHits<unknown>({
        requests: [{ indexName, query, hitsPerPage }]
    });

    return (results[0]?.hits ?? []).map(normalizeAlgoliaProduct);
}

/** Causa por la que no se pudo cargar un producto. */
export type ProductLoadErrorCode = 'notFound' | 'network' | 'unavailable';

/** Error lanzado cuando no se puede cargar un producto. */
export class ProductLoadError extends Error {
    /** Causa del error. */
    readonly code: ProductLoadErrorCode;

    /** @param code Causa del error. */
    constructor(code: ProductLoadErrorCode) {
        super(code);
        this.name = 'ProductLoadError';
        this.code = code;
    }
}

/** Causa por la que falló una consulta a Algolia. */
export type AlgoliaRequestErrorCode = 'network' | 'unavailable';

/** Error lanzado cuando no se puede consultar Algolia. */
export class AlgoliaRequestError extends Error {
    /** Causa del error. */
    readonly code: AlgoliaRequestErrorCode;

    /** @param code Causa del error. */
    constructor(code: AlgoliaRequestErrorCode) {
        super(code);
        this.name = 'AlgoliaRequestError';
        this.code = code;
    }
}

/**
 * Indica si una respuesta 404 de Algolia se debe a que el índice no existe.
 * Algolia responde "Index '...' does not exist" en ese caso, y "ObjectID does
 * not exist" cuando solo falta el registro.
 *
 * @param response Respuesta 404 de Algolia.
 * @return Verdadero si el índice consultado no existe.
 */
async function isMissingIndexResponse(response: Response): Promise<boolean> {
    const body: unknown = await response.json().catch(() => null);
    const message = (body as { message?: unknown } | null)?.message;

    return typeof message === 'string' && message.startsWith('Index ');
}

/**
 * Obtiene un registro de un índice de Algolia por su objectID, usando la
 * API REST.
 *
 * @param targetIndexName Índice a consultar.
 * @param objectID Identificador del registro.
 * @return El registro tal como lo devuelve Algolia, o null si no existe.
 * @throws {AlgoliaRequestError} Con código "unavailable" si Algolia no está
 *     configurado, el índice no existe o Algolia responde con error, o
 *     "network" si no se pudo contactar.
 */
export async function getAlgoliaObject(
    targetIndexName: string | undefined,
    objectID: string
): Promise<unknown> {
    if (!applicationId || !searchApiKey || !targetIndexName) {
        console.error('Falta configurar Algolia: aplicación, clave de búsqueda o nombre del índice.');
        throw new AlgoliaRequestError('unavailable');
    }

    let response: Response;

    try {
        response = await fetch(
            `https://${applicationId}-dsn.algolia.net/1/indexes/${encodeURIComponent(targetIndexName)}/${encodeURIComponent(objectID)}`,
            {
                headers: {
                    'X-Algolia-Application-Id': applicationId,
                    'X-Algolia-API-Key': searchApiKey
                }
            }
        );
    } catch (networkError) {
        console.error('No se pudo contactar a Algolia:', networkError);
        throw new AlgoliaRequestError('network');
    }

    if (response.status === 404) {
        if (await isMissingIndexResponse(response)) {
            console.error(`El índice "${targetIndexName}" no existe en Algolia.`);
            throw new AlgoliaRequestError('unavailable');
        }

        return null;
    }

    if (!response.ok) {
        console.error(`Algolia respondió con HTTP ${response.status}.`);
        throw new AlgoliaRequestError('unavailable');
    }

    return response.json();
}

/**
 * Obtiene un producto por su identificador.
 *
 * @param productId Identificador del producto.
 * @return El producto normalizado.
 * @throws {ProductLoadError} Si el producto no existe, hay un error de red
 *     o Algolia no está disponible.
 */
export async function getProductById(productId: string): Promise<Product> {
    let hit: unknown;

    try {
        hit = await getAlgoliaObject(indexName, productId);
    } catch (error) {
        throw error instanceof AlgoliaRequestError ? new ProductLoadError(error.code) : error;
    }

    if (hit === null) {
        throw new ProductLoadError('notFound');
    }

    return normalizeAlgoliaProduct(hit);
}
