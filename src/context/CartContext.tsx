/**
 * @fileoverview Estado global del carrito de compras y cálculo de sus totales.
 * El carrito guarda el precio B2C y el B2B de cada producto, y aplica el que
 * corresponde al usuario actual; así se recalcula solo al cambiar de sesión.
 */

import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode
} from 'react';

import { getCustomerPrice, type PriceTier } from '../pricing/customerPrice';
import { usePriceTier } from '../pricing/usePriceTier';
import { getProductById } from '../utils/algolia';
import type { Product } from '../utils/Products';

/** Clave de localStorage donde se guarda el carrito. */
const CART_STORAGE_KEY = 'shopping-cart-v2';

/** Tasa de envío aplicada sobre el subtotal. */
export const SHIPPING_RATE = 0.05;
/** Tasa del impuesto al valor agregado (IVA) aplicada sobre el subtotal. */
export const IVA_RATE = 0.13;

/** Producto del carrito con el precio que se le aplica al usuario actual. */
export interface CartItem {
    /** Identificador del producto (objectID de Algolia). */
    id: string;
    name: string;
    /** Precio unitario aplicado. */
    price: number;
    /** Tipo de precio aplicado: B2C o B2B. */
    priceTier: PriceTier;
    currency: string;
    image: string;
    quantity: number;
}

/** Producto tal como se guarda en el carrito, con sus dos precios. */
interface StoredCartItem {
    id: string;
    name: string;
    currency: string;
    image: string;
    quantity: number;
    /** Precio B2C. */
    retailPrice: number;
    /**
     * Precio B2B; null si el producto no tiene un precio de empresa válido, y
     * undefined si todavía no se conoce (carritos guardados antes de los
     * precios B2B, que se completan consultando Algolia).
     */
    businessPrice?: number | null;
}

/** Precios actualizados de un producto del carrito. */
interface RefreshedPrices {
    retailPrice: number;
    businessPrice: number | null;
}

/** Unidades compradas de un producto, para descontarlas del carrito. */
export type PurchasedUnits = Pick<CartItem, 'id' | 'quantity'>;

/** Contenido del carrito. */
type CartState = StoredCartItem[];

/** Acciones que modifican el carrito. */
type CartAction =
    | {
          type: 'ADD_PRODUCT';
          payload: {
              product: Product;
              quantity?: number;
          };
      }
    | {
          type: 'INCREASE_QUANTITY';
          payload: {
              id: string;
          };
      }
    | {
          type: 'DECREASE_QUANTITY';
          payload: {
              id: string;
          };
      }
    | {
          type: 'REMOVE_PRODUCT';
          payload: {
              id: string;
          };
      }
    | {
          type: 'SET_QUANTITY';
          payload: {
              id: string;
              quantity: number;
          };
      }
    | {
          type: 'REMOVE_PURCHASED_ITEMS';
          payload: {
              purchasedItems: PurchasedUnits[];
          };
      }
    | {
          type: 'REFRESH_PRICES';
          payload: {
              pricesById: Record<string, RefreshedPrices>;
          };
      };


/**
 * Obtiene los dos precios de un producto del catálogo para guardarlos en el
 * carrito.
 *
 * @param product Producto del catálogo.
 * @return El precio B2C y el B2B, o null en el B2B si no es válido.
 */
function getStoredPrices(product: Product): RefreshedPrices {
    const businessPrice = getCustomerPrice(product, 'B2B');

    return {
        retailPrice: product.b2c.price,
        businessPrice: businessPrice.problem ? null : businessPrice.amount
    };
}

/**
 * Crea el producto que se guarda en el carrito, con sus dos precios.
 *
 * @param product Producto del catálogo.
 * @param quantity Cantidad a agregar.
 * @return El producto listo para guardarse.
 */
function toStoredCartItem(product: Product, quantity: number): StoredCartItem {
    return {
        id: String(product.objectID),
        name: product.title,
        currency: product.b2c.currency,
        image: product.image_url,
        quantity,
        ...getStoredPrices(product)
    };
}

/**
 * Calcula el nuevo estado del carrito a partir de una acción. Agregar un
 * producto existente suma la cantidad, y disminuir nunca baja de 1.
 *
 * @param state Estado actual del carrito.
 * @param action Acción a aplicar.
 * @return El nuevo estado del carrito.
 */
function cartReducer(
    state: CartState,
    action: CartAction
): CartState {
    switch (action.type) {
        case 'ADD_PRODUCT': {
            const { product, quantity = 1 } = action.payload;

            const existingProduct = state.find(
                (item) => item.id === String(product.objectID)
            );

            if (existingProduct) {
                return state.map((item) =>
                    item.id === String(product.objectID)
                        ? {
                              ...item,
                              quantity: item.quantity + quantity
                          }
                        : item
                );
            }

            return [...state, toStoredCartItem(product, quantity)];
        }

        case 'INCREASE_QUANTITY':
            return state.map((item) =>
                item.id === action.payload.id
                    ? {
                          ...item,
                          quantity: item.quantity + 1
                      }
                    : item
            );

        case 'DECREASE_QUANTITY':
            return state.map((item) =>
                item.id === action.payload.id
                    ? {
                          ...item,
                          quantity: Math.max(1, item.quantity - 1)
                      }
                    : item
            );

        case 'REMOVE_PRODUCT':
            return state.filter(
                (item) => item.id !== action.payload.id
            );

        case 'SET_QUANTITY':
            return state.map((item) =>
                item.id === action.payload.id
                    ? {
                          ...item,
                          quantity: Math.max(1, action.payload.quantity)
                      }
                    : item
            );

        case 'REMOVE_PURCHASED_ITEMS': {
            const { purchasedItems } = action.payload;

            // A cada producto se le restan las unidades compradas; si no queda ninguna, sale del carrito.
            return state
                .map((item) => {
                    const purchasedItem = purchasedItems.find(
                        (purchased) => purchased.id === item.id
                    );

                    return purchasedItem
                        ? { ...item, quantity: item.quantity - purchasedItem.quantity }
                        : item;
                })
                .filter((item) => item.quantity > 0);
        }

        case 'REFRESH_PRICES': {
            const { pricesById } = action.payload;

            return state.map((item) =>
                pricesById[item.id] ? { ...item, ...pricesById[item.id] } : item
            );
        }

        default:
            return state;
    }
}

/**
 * Convierte un producto recuperado de localStorage al formato actual. Los
 * carritos guardados antes de los precios B2B solo tienen "price"; se toma
 * como precio B2C y el precio de empresa queda como desconocido, para
 * consultarlo después.
 *
 * @param item Valor recuperado.
 * @return El producto en el formato actual, o null si no es válido.
 */
function readStoredCartItem(item: unknown): StoredCartItem | null {
    if (typeof item !== 'object' || item === null) {
        return null;
    }

    const storedItem = item as Partial<StoredCartItem> & { price?: unknown };
    const retailPrice = typeof storedItem.retailPrice === 'number'
        ? storedItem.retailPrice
        : storedItem.price;

    if (
        typeof storedItem.id !== 'string' ||
        typeof storedItem.name !== 'string' ||
        typeof storedItem.quantity !== 'number' ||
        typeof retailPrice !== 'number'
    ) {
        return null;
    }

    return {
        id: storedItem.id,
        name: storedItem.name,
        currency: typeof storedItem.currency === 'string' ? storedItem.currency : 'CRC',
        image: typeof storedItem.image === 'string' ? storedItem.image : '',
        quantity: storedItem.quantity,
        retailPrice,
        businessPrice: typeof storedItem.businessPrice === 'number' || storedItem.businessPrice === null
            ? storedItem.businessPrice
            : undefined
    };
}

/**
 * Recupera el carrito guardado en localStorage.
 *
 * @return Los productos válidos guardados, o un carrito vacío si no hay
 *     datos o están dañados.
 */
function getInitialCart(): CartState {
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);

        if (!storedCart) {
            return [];
        }

        const parsedCart: unknown = JSON.parse(storedCart);

        if (!Array.isArray(parsedCart)) {
            return [];
        }

        return parsedCart
            .map(readStoredCartItem)
            .filter((item): item is StoredCartItem => item !== null);
    } catch (error) {
        console.error(
            'No se pudo recuperar el carrito:',
            error
        );

        return [];
    }
}

/**
 * Aplica a un producto del carrito el precio del tipo de cliente actual. Si
 * el cliente es B2B pero el producto no tiene un precio de empresa conocido y
 * válido, se usa el precio B2C y la línea queda marcada como B2C.
 *
 * @param item Producto guardado en el carrito.
 * @param priceTier Tipo de precio del usuario actual.
 * @return El producto con su precio aplicado.
 */
function toPricedCartItem(item: StoredCartItem, priceTier: PriceTier): CartItem {
    const businessPrice = typeof item.businessPrice === 'number' ? item.businessPrice : null;
    const usesBusinessPrice = priceTier === 'B2B' && businessPrice !== null;

    return {
        id: item.id,
        name: item.name,
        price: usesBusinessPrice ? businessPrice : item.retailPrice,
        priceTier: usesBusinessPrice ? 'B2B' : 'B2C',
        currency: item.currency,
        image: item.image,
        quantity: item.quantity
    };
}

/**
 * Consulta en Algolia los precios actuales de algunos productos del carrito.
 * Los productos que no se pudieron consultar quedan fuera del resultado.
 *
 * @param productIds Identificadores de los productos.
 * @return Los precios B2C y B2B de cada producto consultado.
 */
async function loadCurrentPrices(productIds: string[]): Promise<Record<string, RefreshedPrices>> {
    console.log('Consultando precios de empresa de productos guardados antes en el carrito:', productIds);

    const results = await Promise.allSettled(productIds.map((productId) => getProductById(productId)));
    const pricesById: Record<string, RefreshedPrices> = {};

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            pricesById[productIds[index]] = getStoredPrices(result.value);
        } else {
            console.error(`No se pudieron consultar los precios de ${productIds[index]}:`, result.reason);
        }
    });

    return pricesById;
}

/** Montos que resumen el costo de un grupo de productos. */
export interface CartTotals {
    /** Total de los productos antes de impuestos y envío. */
    subtotal: number;
    iva: number;
    shipping: number;
    /** Subtotal más IVA y envío. */
    total: number;
}

/**
 * Calcula el subtotal, el IVA, el envío y el total de un grupo de productos,
 * ya sea todo el carrito o solo la parte que se va a comprar.
 *
 * @param items Productos con su precio y cantidad.
 * @return Los montos calculados.
 */
export function calculateCartTotals(items: CartItem[]): CartTotals {
    const subtotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
    const iva = subtotal * IVA_RATE;
    const shipping = subtotal * SHIPPING_RATE;

    return { subtotal, iva, shipping, total: subtotal + iva + shipping };
}

/** Valor que expone el contexto del carrito. */
interface CartContextType {
    /** Productos con el precio que le corresponde al usuario actual. */
    cart: CartItem[];

    /** Tipo de precio que se está aplicando a todo el carrito. */
    priceTier: PriceTier;

    addProduct: (
        product: Product,
        quantity?: number
    ) => void;

    increaseQuantity: (id: string) => void;

    decreaseQuantity: (id: string) => void;

    removeProduct: (id: string) => void;

    /** Cambia la cantidad de un producto; nunca baja de 1. */
    setItemQuantity: (id: string, quantity: number) => void;

    /** Resta del carrito las unidades compradas y deja el resto. */
    removePurchasedItems: (purchasedItems: PurchasedUnits[]) => void;

    /** Suma de las cantidades de todos los productos. */
    totalItems: number;

    /** Total de los productos antes de impuestos y envío. */
    subtotal: number;

    iva: number;

    shipping: number;

    /** Subtotal más IVA y envío. */
    total: number;
}

/** Contexto del carrito; es undefined fuera de CartProvider. */
const CartContext = createContext<CartContextType | undefined>(
    undefined
);

/** Propiedades de CartProvider. */
interface CartProviderProps {
    children: ReactNode;
}

/**
 * Proveedor que mantiene el estado del carrito y lo persiste en localStorage.
 * Debe estar dentro de SessionProvider, porque el precio aplicado depende del
 * usuario.
 *
 * @param props Propiedades del componente.
 * @param props.children Componentes que tendrán acceso al contexto.
 * @return El proveedor del contexto envolviendo a sus hijos.
 */
export function CartProvider({
    children
}: CartProviderProps) {
    const [storedCart, dispatch] = useReducer(
        cartReducer,
        [],
        getInitialCart
    );
    const priceTier = usePriceTier();

    useEffect(() => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(storedCart)
        );
    }, [storedCart]);

    useEffect(() => {
        console.log(`Precios del carrito calculados con el tipo de precio ${priceTier}.`);
    }, [priceTier]);

    // Productos guardados antes de los precios B2B: se consulta su precio de empresa una vez.
    const unknownPriceIds = storedCart
        .filter((item) => item.businessPrice === undefined)
        .map((item) => item.id)
        .join(',');

    useEffect(() => {
        if (unknownPriceIds === '') {
            return;
        }

        let isCurrentRequest = true;

        loadCurrentPrices(unknownPriceIds.split(',')).then((pricesById) => {
            if (isCurrentRequest && Object.keys(pricesById).length > 0) {
                dispatch({ type: 'REFRESH_PRICES', payload: { pricesById } });
            }
        });

        return () => {
            isCurrentRequest = false;
        };
    }, [unknownPriceIds]);

    const fallbackPriceIds = priceTier === 'B2B'
        ? storedCart.filter((item) => item.businessPrice === null).map((item) => item.id).join(', ')
        : '';

    useEffect(() => {
        if (fallbackPriceIds !== '') {
            console.warn(`Productos sin precio B2B válido; se cobran con precio B2C: ${fallbackPriceIds}.`);
        }
    }, [fallbackPriceIds]);

    const cart = storedCart.map((item) => toPricedCartItem(item, priceTier));

    const addProduct = (
        product: Product,
        quantity = 1
    ) => {
        dispatch({
            type: 'ADD_PRODUCT',
            payload: {
                product,
                quantity
            }
        });
    };

    const increaseQuantity = (id: string) => {
        dispatch({
            type: 'INCREASE_QUANTITY',
            payload: { id }
        });
    };

    const decreaseQuantity = (id: string) => {
        dispatch({
            type: 'DECREASE_QUANTITY',
            payload: { id }
        });
    };

    const removeProduct = (id: string) => {
        dispatch({
            type: 'REMOVE_PRODUCT',
            payload: { id }
        });
    };

    const setItemQuantity = (id: string, quantity: number) => {
        console.log(`Cantidad de ${id} ajustada a ${quantity}.`);
        dispatch({
            type: 'SET_QUANTITY',
            payload: { id, quantity }
        });
    };

    const removePurchasedItems = (purchasedItems: PurchasedUnits[]) => {
        console.log('Se descuentan del carrito los productos comprados:', purchasedItems);
        dispatch({
            type: 'REMOVE_PURCHASED_ITEMS',
            payload: { purchasedItems }
        });
    };

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const { subtotal, iva, shipping, total } = calculateCartTotals(cart);

    return (
        <CartContext.Provider
            value={{
                cart,
                priceTier,
                addProduct,
                increaseQuantity,
                decreaseQuantity,
                removeProduct,
                setItemQuantity,
                removePurchasedItems,
                totalItems,
                subtotal,
                iva,
                shipping,
                total
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

/**
 * Da acceso al carrito y a sus operaciones.
 *
 * @return El valor del contexto del carrito.
 * @throws {Error} Si se usa fuera de CartProvider.
 */
export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            'useCart debe utilizarse dentro de CartProvider'
        );
    }

    return context;
}
