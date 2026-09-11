
/* =====================
   TIPOS DEL JSON
===================== */

export interface B2C {
    enabled: boolean;
    price: number;
    currency: string;
    available: boolean;
}


export interface B2B {
    enabled: boolean;
    price: number;
    currency: string;
    minimumOrder: number;
    businessDiscount: number;
}


export interface Location {
    locationId: string;
    title: string;
    city: string;
    country: string;
    stock: number;
    available: boolean;
}


export interface Product {
    objectID: string;
    sku: string;
    title: string;
    description: string;

    categories: string[];

    brand: string;

    b2c: B2C;
    b2b: B2B;

    locations: Location[];

    in_stock: boolean;
    stock_quantity: number;

    rating: number;

    image_url: string;

    facets: Record<string, string | number | boolean>;

    tags: string[];

    active: boolean;
}


/* =====================
   FILTROS
===================== */

export interface ProductFilters {
    search: string;
    categories: string[];
    minPrice: number;
    maxPrice: number;
}


/*
 * El JSON contiene productos que superan
 * ₡1,000,000, por ejemplo Bvlgari y Cartier.
 *
 * Por eso aumentamos el máximo para que
 * esos productos también puedan aparecer.
 */

export const MIN_PRICE = 0;
export const MAX_PRICE = 3_000_000;
export const PRICE_STEP = 10_000;


export const DEFAULT_FILTERS: ProductFilters = {
    search: '',
    categories: [],
    minPrice: MIN_PRICE,
    maxPrice: MAX_PRICE
};


/* =====================
   NORMALIZACIÓN
===================== */

/*
 * Convierte:
 *
 * "Audífonos" → "audifonos"
 * "Oro Rosa"  → "oro rosa"
 *
 * Esto permite hacer búsquedas sin
 * preocuparnos por mayúsculas o tildes.
 */

const normalize = (text: string) =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();


/* =====================
   FILTRADO
===================== */

export function filterProducts(
    products: Product[],
    filters: ProductFilters
): Product[] {

    const term = normalize(filters.search);


    return products.filter((product) => {

        /*
         * 1. PRODUCTO ACTIVO
         *
         * Los productos con active = false
         * no deberían mostrarse en la tienda.
         */

        if (!product.active) {
            return false;
        }


        /*
         * 2. DISPONIBILIDAD B2C
         *
         * Como esta es la tienda para clientes,
         * utilizamos la información de b2c.
         */

        if (!product.b2c.enabled) {
            return false;
        }


        /*
         * 3. BÚSQUEDA DE TEXTO
         *
         * Busca en:
         *
         * - título
         * - marca
         * - descripción
         * - categorías
         * - SKU
         * - tags
         */

        if (term !== '') {

            const haystack = normalize(
                [
                    product.title,
                    product.brand,
                    product.description,
                    product.categories.join(' '),
                    product.sku,
                    product.tags.join(' ')
                ].join(' ')
            );


            if (!haystack.includes(term)) {
                return false;
            }

        }


        /*
         * 4. CATEGORÍAS
         *
         * El producto pasa si pertenece
         * a al menos una categoría seleccionada.
         */

        if (filters.categories.length > 0) {

            const matchesCategory = filters.categories.some(
                (category) =>
                    product.categories.includes(category)
            );


            if (!matchesCategory) {
                return false;
            }

        }


        const price = product.b2c.price;


        if (price < filters.minPrice) {
            return false;
        }


        if (price > filters.maxPrice) {
            return false;
        }


        return true;

    });

}