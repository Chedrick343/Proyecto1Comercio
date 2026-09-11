import type { Product, ProductFilters } from './Products';
import { MIN_PRICE, MAX_PRICE } from './Products';
const applicationId = import.meta.env.VITE_ALGOLIA_APPLICATION_ID;
const searchApiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
const indexName = import.meta.env.VITE_ALGOLIA_INDEX_NAME;

export async function searchProducts(
    filters: ProductFilters,
    signal?: AbortSignal
): Promise<Product[]> {
    if (!applicationId || !searchApiKey || !indexName) {
        throw new Error(
            'Faltan VITE_ALGOLIA_APPLICATION_ID, VITE_ALGOLIA_SEARCH_API_KEY o VITE_ALGOLIA_INDEX_NAME.'
        );
    }

    const numericFilters: string[] = [];

    if (filters.minPrice > MIN_PRICE) {
        numericFilters.push(`b2c.price>=${filters.minPrice}`);
    }

    if (filters.maxPrice < MAX_PRICE) {
        numericFilters.push(`b2c.price<=${filters.maxPrice}`);
    }

    const response = await fetch(
        `https://${applicationId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}/query`,
        {
            method: 'POST',
            headers: {
                'X-Algolia-Application-Id': applicationId,
                'X-Algolia-API-Key': searchApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: filters.search,
                facetFilters:
                    filters.categories.length > 0
                        ? [
                            filters.categories.map(
                                (category) => `categories:${category}`
                            )
                        ]
                        : undefined,
                numericFilters:
                    numericFilters.length > 0
                        ? numericFilters
                        : undefined,
                hitsPerPage: 1000
            }),
            signal
        }
    );

    if (!response.ok) {
        throw new Error(`Algolia respondió con HTTP ${response.status}.`);
    }

    const data: { hits: Product[] } = await response.json();
    return data.hits;
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

    return response.json() as Promise<Product>;
}
