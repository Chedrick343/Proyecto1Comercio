/**
 * @fileoverview Estado global de las órdenes de compra y su historial de pagos.
 */

import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode
} from 'react';

import { isValidOrderChange } from '../orders/orderStateMachine';
import type { Order } from '../orders/orderTypes';

/** Clave de localStorage donde se guardan las órdenes. */
const ORDERS_STORAGE_KEY = 'orders-v1';

/** Órdenes registradas, de la más reciente a la más antigua. */
type OrdersState = Order[];

/** Acciones que modifican las órdenes. */
type OrdersAction =
    | {
          type: 'ADD_ORDER';
          payload: {
              order: Order;
          };
      }
    | {
          type: 'SAVE_ORDER';
          payload: {
              order: Order;
          };
      };

/**
 * Calcula el nuevo estado de las órdenes a partir de una acción. Al guardar
 * una orden existente se ignoran los cambios de estado que las reglas de
 * transición no permiten, como modificar una orden ya confirmada.
 *
 * @param state Estado actual de las órdenes.
 * @param action Acción a aplicar.
 * @return El nuevo estado de las órdenes.
 */
function ordersReducer(
    state: OrdersState,
    action: OrdersAction
): OrdersState {
    switch (action.type) {
        case 'ADD_ORDER':
            return [action.payload.order, ...state];

        case 'SAVE_ORDER': {
            const { order: savedOrder } = action.payload;

            return state.map((order) => {
                if (order.orderNumber !== savedOrder.orderNumber) {
                    return order;
                }

                if (!isValidOrderChange(order, savedOrder)) {
                    console.error('Cambio de estado no permitido en la orden:', order.orderNumber);
                    return order;
                }

                return savedOrder;
            });
        }

        default:
            return state;
    }
}

/**
 * Verifica si un valor es un objeto no nulo.
 *
 * @param value Valor a verificar.
 * @return Verdadero si el valor es un objeto.
 */
const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

/**
 * Verifica que un valor recuperado tenga la forma de una orden.
 *
 * @param order Valor a verificar.
 * @return Verdadero si el valor es una orden válida.
 */
const isValidOrder = (order: unknown): order is Order =>
    isObject(order) &&
    typeof order.orderNumber === 'string' &&
    typeof order.createdAt === 'string' &&
    typeof order.total === 'number' &&
    typeof order.orderStatus === 'string' &&
    typeof order.paymentStatus === 'string' &&
    isObject(order.customer) &&
    Array.isArray(order.items) &&
    order.items.every(isObject);

/**
 * Recupera las órdenes guardadas en localStorage.
 *
 * @return Las órdenes válidas guardadas, o una lista vacía si no hay datos
 *     o están dañados.
 */
function getInitialOrders(): OrdersState {
    try {
        const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);

        if (!storedOrders) {
            return [];
        }

        const parsedOrders = JSON.parse(storedOrders);

        if (!Array.isArray(parsedOrders)) {
            return [];
        }

        return parsedOrders.filter(isValidOrder);
    } catch (error) {
        console.error(
            'No se pudieron recuperar las órdenes:',
            error
        );

        return [];
    }
}

/** Valor que expone el contexto de órdenes. */
interface OrdersContextType {
    orders: OrdersState;

    addOrder: (order: Order) => void;

    /** Reemplaza una orden registrada por su versión actualizada. */
    saveOrder: (order: Order) => void;

    getOrderByNumber: (orderNumber: string) => Order | undefined;
}

/** Contexto de órdenes; es undefined fuera de OrdersProvider. */
const OrdersContext = createContext<OrdersContextType | undefined>(
    undefined
);

/** Propiedades de OrdersProvider. */
interface OrdersProviderProps {
    children: ReactNode;
}

/**
 * Proveedor que mantiene las órdenes y lo persiste en localStorage.
 *
 * @param props Propiedades del componente.
 * @param props.children Componentes que tendrán acceso al contexto.
 * @return El proveedor del contexto envolviendo a sus hijos.
 */
export function OrdersProvider({
    children
}: OrdersProviderProps) {
    const [orders, dispatch] = useReducer(
        ordersReducer,
        [],
        getInitialOrders
    );

    useEffect(() => {
        try {
            localStorage.setItem(
                ORDERS_STORAGE_KEY,
                JSON.stringify(orders)
            );
        } catch (error) {
            console.error(
                'No se pudieron guardar las órdenes:',
                error
            );
        }
    }, [orders]);

    const addOrder = (order: Order) => {
        dispatch({
            type: 'ADD_ORDER',
            payload: { order }
        });
    };

    const saveOrder = (order: Order) => {
        dispatch({
            type: 'SAVE_ORDER',
            payload: { order }
        });
    };

    const getOrderByNumber = (orderNumber: string) =>
        orders.find((order) => order.orderNumber === orderNumber);

    return (
        <OrdersContext.Provider
            value={{
                orders,
                addOrder,
                saveOrder,
                getOrderByNumber
            }}
        >
            {children}
        </OrdersContext.Provider>
    );
}

/**
 * Da acceso a las órdenes y a sus operaciones.
 *
 * @return El valor del contexto de órdenes.
 * @throws {Error} Si se usa fuera de OrdersProvider.
 */
export function useOrders() {
    const context = useContext(OrdersContext);

    if (!context) {
        throw new Error(
            'useOrders debe utilizarse dentro de OrdersProvider'
        );
    }

    return context;
}
