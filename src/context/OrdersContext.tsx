import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode
} from 'react';

import {
    getOrderStatusForPayment,
    type Order,
    type PaymentStatus
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

/** Datos que el resultado del Sandbox aporta a una orden existente. */
export interface PaymentUpdate {
    paymentStatus: PaymentStatus;
    transactionId?: string;
    paymentMessage?: string;
}

function ordersReducer(
    state: OrdersState,
    action: OrdersAction
): OrdersState {
    switch (action.type) {
        case 'ADD_ORDER':
            // Las órdenes más recientes quedan primero.
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
                // Una orden confirmada no puede volver a cambiar de estado.
                if (
                    order.orderNumber !== orderNumber ||
                    order.orderStatus === 'CONFIRMED'
                ) {
                    return order;
                }

                return {
                    ...order,
                    paymentStatus,
                    orderStatus: getOrderStatusForPayment(paymentStatus),
                    paymentAttempts:
                        paymentStatus === 'PENDING'
                            ? order.paymentAttempts
                            : order.paymentAttempts + 1,
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

const isValidOrder = (order: unknown): order is Order =>
    typeof order === 'object' &&
    order !== null &&
    typeof (order as Order).orderNumber === 'string' &&
    typeof (order as Order).createdAt === 'string' &&
    typeof (order as Order).total === 'number' &&
    Array.isArray((order as Order).items);

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

    /** Guarda una orden nueva (normalmente creada con createOrder). */
    addOrder: (order: Order) => void;

    /**
     * Registra el resultado del pago en la orden y actualiza su estado
     * según getOrderStatusForPayment.
     */
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
