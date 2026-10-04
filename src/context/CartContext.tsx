import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode
} from 'react';

import type { Product } from '../utils/Products';

const CART_STORAGE_KEY = 'shopping-cart-v2';

export const SHIPPING_RATE = 0.05;
export const IVA_RATE = 0.13;

export interface CartItem {
    id: string;
    name: string;
    price: number;
    currency: string;
    image: string;
    quantity: number;
}

type CartState = CartItem[];

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
const isValidCartItem = (item: unknown): item is CartItem =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as CartItem).id === 'string' &&
    typeof (item as CartItem).name === 'string' &&
    typeof (item as CartItem).price === 'number' &&
    typeof (item as CartItem).quantity === 'number';
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

    totalItems: number;

    subtotal: number;

    iva: number;

    shipping: number;

    total: number;
}

const CartContext = createContext<CartContextType | undefined>(
    undefined
);

interface CartProviderProps {
    children: ReactNode;
}

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

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            'useCart debe utilizarse dentro de CartProvider'
        );
    }

    return context;
}