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

const ORDERS_STORAGE_KEY = 'orders-v1';

type OrdersState = Order[];

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

export interface PaymentUpdate {
    paymentStatus: ProcessedPaymentStatus;
    transactionId?: string;
    paymentMessage?: string;
}

const isOrderConfirmed = (order: Order) => order.orderStatus === 'CONFIRMED';

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

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

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

interface OrdersContextType {
    orders: OrdersState;

    addOrder: (order: Order) => void;

    updateOrderPayment: (
        orderNumber: string,
        update: PaymentUpdate
    ) => void;

    getOrderByNumber: (orderNumber: string) => Order | undefined;
}

const OrdersContext = createContext<OrdersContextType | undefined>(
    undefined
);

interface OrdersProviderProps {
    children: ReactNode;
}

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

export function useOrders() {
    const context = useContext(OrdersContext);

    if (!context) {
        throw new Error(
            'useOrders debe utilizarse dentro de OrdersProvider'
        );
    }

    return context;
}
