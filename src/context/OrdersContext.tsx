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

import {
    ORDER_STATUS_BY_PAYMENT_STATUS,
    type Order,
    type ProcessedPaymentStatus
} from '../orders/orderTypes';

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
          type: 'UPDATE_PAYMENT';
          payload: PaymentUpdate & {
              orderNumber: string;
              updatedAt: string;
          };
      };

/** Resultado de un intento de pago que se registra en una orden. */
export interface PaymentUpdate {
    paymentStatus: ProcessedPaymentStatus;
    transactionId?: string;
    paymentMessage?: string;
}

/**
 * Indica si una orden ya fue confirmada.
 *
 * @param order Orden a revisar.
 * @return Verdadero si la orden está en estado CONFIRMED.
 */
const isOrderConfirmed = (order: Order) => order.orderStatus === 'CONFIRMED';

/**
 * Calcula el nuevo estado de las órdenes a partir de una acción. Las órdenes
 * confirmadas no se modifican al registrar nuevos pagos.
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

        case 'UPDATE_PAYMENT': {
            const {
                orderNumber,
                paymentStatus,
                transactionId,
                paymentMessage,
                updatedAt
            } = action.payload;

            return state.map((order) => {
                if (order.orderNumber !== orderNumber || isOrderConfirmed(order)) {
                    return order;
                }

                return {
                    ...order,
                    paymentStatus,
                    orderStatus: ORDER_STATUS_BY_PAYMENT_STATUS[paymentStatus],
                    paymentAttempts: order.paymentAttempts + 1,
                    transactionId: transactionId ?? order.transactionId,
                    paymentMessage,
                    updatedAt
                };
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

    /** Registra el resultado de un intento de pago en la orden indicada. */
    updateOrderPayment: (
        orderNumber: string,
        update: PaymentUpdate
    ) => void;

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

    const updateOrderPayment = (
        orderNumber: string,
        update: PaymentUpdate
    ) => {
        dispatch({
            type: 'UPDATE_PAYMENT',
            payload: {
                ...update,
                orderNumber,
                updatedAt: new Date().toISOString()
            }
        });
    };

    const getOrderByNumber = (orderNumber: string) =>
        orders.find((order) => order.orderNumber === orderNumber);

    return (
        <OrdersContext.Provider
            value={{
                orders,
                addOrder,
                updateOrderPayment,
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
