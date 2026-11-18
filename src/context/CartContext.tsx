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

import { getBusinessMinimum } from '../pricing/businessMinimum';
import { getCustomerPrice, type PriceTier } from '../pricing/customerPrice';
import { usePriceTier } from '../pricing/usePriceTier';
import { getProductById } from '../utils/algolia';
import { getOrderOwnerId } from '../orders/orderOwner';
import { getGuestSessionId } from '../session/guestSession';
import { hasPermission } from '../session/permissions';
import type { User } from '../session/userTypes';
import { useSession } from './SessionContext';
import type { Product } from '../utils/Products';

/** Clave de localStorage donde se guardan los carritos, uno por dueño. */
const CART_STORAGE_KEY = 'shopping-carts-v3';

/**
 * Clave del carrito único de versiones anteriores. Si existe, se le asigna al
 * invitado de este navegador y se borra.
 */
const LEGACY_CART_STORAGE_KEY = 'shopping-cart-v2';

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
    /** Unidades mínimas que debe comprar el usuario actual (mínimo B2B, o 1). */
    minimumQuantity: number;
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
    /**
     * Mínimo de compra B2B; undefined si todavía no se conoce (carritos
     * guardados antes de esta condición, que también se completan en Algolia).
     */
    businessMinimum?: number;
}

/** Condiciones comerciales de un producto que se guardan en el carrito. */
interface ItemConditions {
    retailPrice: number;
    businessPrice: number | null;
    businessMinimum: number;
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
          type: 'REFRESH_CONDITIONS';
          payload: {
              conditionsById: Record<string, ItemConditions>;
          };
      };

/**
 * Carritos de este navegador por dueño: el identificador del usuario, o el
 * del invitado (guest-...).
 */
type CartsByOwner = Record<string, CartState>;

/** Acciones sobre los carritos: un cambio en el carrito de un dueño, o pasar uno a otro. */
type CartsAction =
    | { type: 'OWNER_ACTION'; ownerId: string; action: CartAction }
    | { type: 'MOVE_CART'; fromOwnerId: string; toOwnerId: string };


/**
 * Obtiene las condiciones comerciales de un producto del catálogo para
 * guardarlas en el carrito.
 *
 * @param product Producto del catálogo.
 * @return El precio B2C, el B2B (null si no es válido) y el mínimo B2B.
 */
function getItemConditions(product: Product): ItemConditions {
    const businessPrice = getCustomerPrice(product, 'B2B');

    return {
        retailPrice: product.b2c.price,
        businessPrice: businessPrice.problem ? null : businessPrice.amount,
        businessMinimum: getBusinessMinimum(product)
    };
}

/**
 * Crea el producto que se guarda en el carrito, con sus condiciones comerciales.
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
        ...getItemConditions(product)
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

        case 'REFRESH_CONDITIONS': {
            const { conditionsById } = action.payload;

            return state.map((item) =>
                conditionsById[item.id] ? { ...item, ...conditionsById[item.id] } : item
            );
        }

        default:
            return state;
    }
}

/**
 * Convierte un producto recuperado de localStorage al formato actual. Los
 * carritos guardados antes de los precios B2B solo tienen "price"; se toma
 * como precio B2C, y el precio y el mínimo de empresa quedan como
 * desconocidos, para consultarlos después.
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
            : undefined,
        businessMinimum: typeof storedItem.businessMinimum === 'number' ? storedItem.businessMinimum : undefined
    };
}

/**
 * Convierte un carrito recuperado de localStorage al formato actual.
 *
 * @param value Valor recuperado.
 * @return Los productos válidos, o un carrito vacío si no es una lista.
 */
function readStoredCart(value: unknown): CartState {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map(readStoredCartItem)
        .filter((item): item is StoredCartItem => item !== null);
}

/**
 * Recupera los carritos guardados en localStorage. Si solo existe el carrito
 * único de versiones anteriores, se le asigna al invitado de este navegador.
 *
 * @return Los carritos por dueño, o ninguno si no hay datos o están dañados.
 */
function getInitialCarts(): CartsByOwner {
    try {
        const storedCarts = localStorage.getItem(CART_STORAGE_KEY);

        if (storedCarts) {
            const parsedCarts: unknown = JSON.parse(storedCarts);

            if (typeof parsedCarts !== 'object' || parsedCarts === null || Array.isArray(parsedCarts)) {
                return {};
            }

            return Object.fromEntries(
                Object.entries(parsedCarts).map(([ownerId, cart]) => [ownerId, readStoredCart(cart)])
            );
        }

        const legacyCart = localStorage.getItem(LEGACY_CART_STORAGE_KEY);

        if (legacyCart) {
            console.log('Se pasa el carrito de la versión anterior al invitado de este navegador.');
            return { [getGuestSessionId()]: readStoredCart(JSON.parse(legacyCart)) };
        }

        return {};
    } catch (error) {
        console.error(
            'No se pudieron recuperar los carritos:',
            error
        );

        return {};
    }
}

/**
 * Calcula los carritos después de una acción. Los cambios de productos se
 * aplican solo al carrito del dueño indicado. Al pasar un carrito a otro
 * dueño, los productos repetidos suman sus cantidades y el carrito de origen
 * queda vacío.
 *
 * @param state Carritos actuales.
 * @param action Acción a aplicar.
 * @return Los carritos actualizados.
 */
function cartsReducer(state: CartsByOwner, action: CartsAction): CartsByOwner {
    if (action.type === 'OWNER_ACTION') {
        return { ...state, [action.ownerId]: cartReducer(state[action.ownerId] ?? [], action.action) };
    }

    const movedItems = state[action.fromOwnerId] ?? [];
    const targetCart = [...(state[action.toOwnerId] ?? [])];

    movedItems.forEach((movedItem) => {
        const index = targetCart.findIndex((item) => item.id === movedItem.id);

        if (index === -1) {
            targetCart.push(movedItem);
        } else {
            targetCart[index] = { ...targetCart[index], quantity: targetCart[index].quantity + movedItem.quantity };
        }
    });

    return { ...state, [action.fromOwnerId]: [], [action.toOwnerId]: targetCart };
}

/**
 * Aplica a un producto del carrito el precio y el mínimo de compra del tipo
 * de cliente actual. Si el cliente es B2B pero el producto no tiene un precio
 * de empresa conocido y válido, se usa el precio B2C, la línea queda marcada
 * como B2C y no se le exige el mínimo B2B.
 *
 * @param item Producto guardado en el carrito.
 * @param priceTier Tipo de precio del usuario actual.
 * @return El producto con su precio y su mínimo aplicados.
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
        quantity: item.quantity,
        minimumQuantity: usesBusinessPrice ? item.businessMinimum ?? 1 : 1
    };
}

/**
 * Consulta en Algolia las condiciones comerciales actuales de los productos
 * del carrito. Los que no se pudieron consultar quedan con los valores que
 * ya tenían.
 *
 * @param productIds Identificadores de los productos.
 * @return Los precios B2C y B2B y el mínimo B2B de cada producto consultado.
 */
async function loadCurrentConditions(productIds: string[]): Promise<Record<string, ItemConditions>> {
    console.log('Consultando en Algolia los precios y el mínimo vigentes de los productos del carrito:', productIds);

    const results = await Promise.allSettled(productIds.map((productId) => getProductById(productId)));
    const conditionsById: Record<string, ItemConditions> = {};

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            conditionsById[productIds[index]] = getItemConditions(result.value);
        } else {
            console.error(`No se pudieron consultar las condiciones de ${productIds[index]}:`, result.reason);
        }
    });

    return conditionsById;
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

    /**
     * Pasa los productos que agregó el invitado de este navegador al carrito
     * de un cliente que acaba de iniciar sesión.
     */
    adoptGuestCart: (user: User) => void;

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
 * Proveedor que mantiene un carrito por dueño (cada usuario y el invitado de
 * este navegador) y los persiste en localStorage; expone el del usuario
 * actual. Debe estar dentro de SessionProvider, porque el carrito y el precio
 * aplicado dependen del usuario.
 *
 * @param props Propiedades del componente.
 * @param props.children Componentes que tendrán acceso al contexto.
 * @return El proveedor del contexto envolviendo a sus hijos.
 */
export function CartProvider({
    children
}: CartProviderProps) {
    const [carts, dispatchCarts] = useReducer(
        cartsReducer,
        {},
        getInitialCarts
    );
    const priceTier = usePriceTier();
    const { currentUser } = useSession();
    const ownerId = getOrderOwnerId(currentUser);
    const storedCart = carts[ownerId] ?? [];

    /**
     * Aplica una acción al carrito del usuario actual.
     *
     * @param action Acción a aplicar.
     */
    const dispatch = (action: CartAction) => dispatchCarts({ type: 'OWNER_ACTION', ownerId, action });

    useEffect(() => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(carts)
        );
        localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    }, [carts]);

    useEffect(() => {
        console.log(`Carrito activo: el de ${ownerId}.`);
    }, [ownerId]);

    useEffect(() => {
        console.log(`Precios del carrito calculados con el tipo de precio ${priceTier}.`);
    }, [priceTier]);

    // El administrador puede cambiar precios y mínimos en Algolia: se consultan
    // los vigentes al abrir la tienda, al cambiar de usuario y al cambiar los productos.
    const cartProductIds = storedCart.map((item) => item.id).join(',');

    useEffect(() => {
        if (cartProductIds === '') {
            return;
        }

        let isCurrentRequest = true;

        loadCurrentConditions(cartProductIds.split(',')).then((conditionsById) => {
            if (isCurrentRequest && Object.keys(conditionsById).length > 0) {
                dispatchCarts({
                    type: 'OWNER_ACTION',
                    ownerId,
                    action: { type: 'REFRESH_CONDITIONS', payload: { conditionsById } }
                });
            }
        });

        return () => {
            isCurrentRequest = false;
        };
    }, [cartProductIds, ownerId]);

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

    const adoptGuestCart = (user: User) => {
        const guestId = getGuestSessionId();

        if (!hasPermission(user, 'ADD_TO_CART') || (carts[guestId] ?? []).length === 0) {
            return;
        }

        console.log(`Los productos del invitado pasan al carrito de ${user.id}.`);
        dispatchCarts({ type: 'MOVE_CART', fromOwnerId: guestId, toOwnerId: user.id });
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
                adoptGuestCart,
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
