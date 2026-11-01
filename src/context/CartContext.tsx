/**
 * @fileoverview Estado global del carrito de compras y cálculo de sus totales.
 */

import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode
} from 'react';

import type { Product } from '../utils/Products';

/** Clave de localStorage donde se guarda el carrito. */
const CART_STORAGE_KEY = 'shopping-cart-v2';

/** Tasa de envío aplicada sobre el subtotal. */
export const SHIPPING_RATE = 0.05;
/** Tasa del impuesto al valor agregado (IVA) aplicada sobre el subtotal. */
export const IVA_RATE = 0.13;

/** Producto agregado al carrito. */
export interface CartItem {
    /** Identificador del producto (objectID de Algolia). */
    id: string;
    name: string;
    price: number;
    currency: string;
    image: string;
    quantity: number;
}

/** Contenido del carrito. */
type CartState = CartItem[];

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
          type: 'CLEAR_CART';
      };


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

            const newItem: CartItem = {
                id: String(product.objectID),
                name: product.title,
                price: product.b2c.price,
                currency: product.b2c.currency,
                image: product.image_url,
                quantity
            };

            return [...state, newItem];
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

        case 'CLEAR_CART':
            return [];

        default:
            return state;
    }
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

        const parsedCart = JSON.parse(storedCart);

        if (!Array.isArray(parsedCart)) {
            return [];
        }

        return parsedCart.filter(isValidCartItem);
    } catch (error) {
        console.error(
            'No se pudo recuperar el carrito:',
            error
        );

        return [];
    }
}
/**
 * Verifica que un valor recuperado tenga la forma de un producto del carrito.
 *
 * @param item Valor a verificar.
 * @return Verdadero si el valor es un producto del carrito válido.
 */
const isValidCartItem = (item: unknown): item is CartItem =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as CartItem).id === 'string' &&
    typeof (item as CartItem).name === 'string' &&
    typeof (item as CartItem).price === 'number' &&
    typeof (item as CartItem).quantity === 'number';
/** Valor que expone el contexto del carrito. */
interface CartContextType {
    cart: CartState;

    addProduct: (
        product: Product,
        quantity?: number
    ) => void;

    increaseQuantity: (id: string) => void;

    decreaseQuantity: (id: string) => void;

    removeProduct: (id: string) => void;

    clearCart: () => void;

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
 *
 * @param props Propiedades del componente.
 * @param props.children Componentes que tendrán acceso al contexto.
 * @return El proveedor del contexto envolviendo a sus hijos.
 */
export function CartProvider({
    children
}: CartProviderProps) {
    const [cart, dispatch] = useReducer(
        cartReducer,
        [],
        getInitialCart
    );

    useEffect(() => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(cart)
        );
    }, [cart]);

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

    const clearCart = () => {
        dispatch({
            type: 'CLEAR_CART'
        });
    };

    const totalItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const subtotal = cart.reduce(
        (total, item) =>
            total + item.price * item.quantity,
        0
    );

    const iva = subtotal * IVA_RATE;

    const shipping = subtotal * SHIPPING_RATE;

    const total = subtotal + iva + shipping;

    return (
        <CartContext.Provider
            value={{
                cart,
                addProduct,
                increaseQuantity,
                decreaseQuantity,
                removeProduct,
                clearCart,
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