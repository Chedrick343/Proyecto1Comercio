/**
 * @fileoverview Tipos de los productos del catálogo y filtrado del lado del cliente.
 */

/** Condiciones de venta a consumidores finales. */
export interface B2C {
    enabled: boolean;
    price: number;
    currency: string;
    available: boolean;
}


/** Condiciones de venta a empresas. */
export interface B2B {
    enabled: boolean;
    price: number;
    currency: string;
    /** Cantidad mínima de unidades por pedido. */
    minimumOrder: number;
    /** Descuento para empresas, expresado como fracción. */
    businessDiscount: number;
}


/** Tienda física y su inventario del producto. */
export interface Location {
    locationId: string;
    title: string;
    city: string;
    country: string;
    stock: number;
    available: boolean;
}


/** Producto del catálogo, tal como se almacena en Algolia. */
export interface Product {
    /** Identificador del producto en Algolia. */
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

    /** Características del producto (material, color, talla, etc.). */
    facets: Record<string, string | number | boolean>;

    tags: string[];

    /** Indica si el producto se puede mostrar en la tienda. */
    active: boolean;
}


/** Criterios para filtrar el catálogo. */
export interface ProductFilters {
    search: string;
    categories: string[];
    minPrice: number;
    maxPrice: number;
}


/** Precio mínimo del filtro de precios. */
export const MIN_PRICE = 0;
/**
 * Precio máximo del filtro de precios. Supera ₡1 000 000 porque hay
 * productos (por ejemplo, de Bvlgari y Cartier) por encima de ese monto.
 */
export const MAX_PRICE = 3_000_000;
/** Incremento del control deslizante de precios. */
export const PRICE_STEP = 10_000;


/**
 * Normaliza un texto para compararlo sin distinguir mayúsculas ni tildes
 * (por ejemplo, "Audífonos" se convierte en "audifonos").
 *
 * @param text Texto a normalizar.
 * @return El texto en minúsculas, sin diacríticos ni espacios en los extremos.
 */
const normalize = (text: string) =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();


/**
 * Filtra los productos visibles para clientes según búsqueda, categorías y precio.
 *
 * @param products Productos a filtrar.
 * @param filters Criterios de filtrado.
 * @return Los productos activos, habilitados para B2C, que cumplen los criterios.
 */
export function filterProducts(
    products: Product[],
    filters: ProductFilters
): Product[] {

    const term = normalize(filters.search);


    return products.filter((product) => {

        // Los productos inactivos no se muestran en la tienda.
        if (!product.active) {
            return false;
        }


        // Esta es la tienda para clientes, así que se usa la información de b2c.
        if (!product.b2c.enabled) {
            return false;
        }


        // Busca en título, marca, descripción, categorías, SKU y tags.
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


        // El producto pasa si pertenece a al menos una categoría seleccionada.
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