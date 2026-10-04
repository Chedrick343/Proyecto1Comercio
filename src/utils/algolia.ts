import { liteClient } from 'algoliasearch/lite';
import type { Product } from './Products';

const applicationId = import.meta.env.VITE_ALGOLIA_APPLICATION_ID;
const searchApiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
export const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME;

export const searchClient = applicationId && searchApiKey
    ? liteClient(applicationId, searchApiKey)
    : null;

type AlgoliaProductHit = Omit<Partial<Product>, 'b2c' | 'b2b'> & {
    b2c?: Partial<Product['b2c']>;
    b2b?: Partial<Product['b2b']>;
    price?: number;
    currency?: string;
};

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

export async function getProductById(productId: string): Promise<Product> {
    if (!applicationId || !searchApiKey || !indexName) {
        throw new Error(
            'Faltan VITE_ALGOLIA_APPLICATION_ID, VITE_ALGOLIA_SEARCH_API_KEY o VITE_ALGOLIA_INDEX_NAME.'
        );
    }

    const response = await fetch(
        `https://${applicationId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}/${encodeURIComponent(productId)}`,
        {
            headers: {
                'X-Algolia-Application-Id': applicationId,
                'X-Algolia-API-Key': searchApiKey
            }
        }
    );

    if (response.status === 404) {
        throw new Error('No encontramos el producto solicitado.');
    }

    if (!response.ok) {
        throw new Error(`Algolia respondió con HTTP ${response.status}.`);
    }

    const hit: unknown = await response.json();
    return normalizeAlgoliaProduct(hit);
}
