/**
 * @fileoverview Estado global de las órdenes de compra y su historial de pagos.
 * Las órdenes se guardan en localStorage y en el índice de órdenes de Algolia
 * (por medio del Cloudflare Worker); al iniciar, se combinan las de ambos.
 */

import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode
} from 'react';

import { discountOrderInventory } from '../inventory/inventoryAdjustments';
import { isValidOrderChange } from '../orders/orderStateMachine';
import type { Order } from '../orders/orderTypes';
import { isValidOrder } from '../orders/orderValidation';
import { loadOrdersFromIndex, saveOrderToIndex } from '../services/ordersIndex/ordersIndexService';
import { searchClient } from '../utils/algolia';

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
      }
    | {
          type: 'MERGE_ORDERS';
          payload: {
              orders: Order[];
          };
      };

/**
 * Combina las órdenes locales con las del índice. Si una orden está en ambos
 * lados, se queda la versión con la fecha de actualización más reciente.
 *
 * @param localOrders Órdenes guardadas en este navegador.
 * @param indexOrders Órdenes leídas del índice de Algolia.
 * @return Todas las órdenes, de la más reciente a la más antigua.
 */
function mergeOrders(localOrders: Order[], indexOrders: Order[]): Order[] {
    const ordersByNumber = new Map<string, Order>();

    localOrders.forEach((order) => ordersByNumber.set(order.orderNumber, order));

    indexOrders.forEach((order) => {
        const localOrder = ordersByNumber.get(order.orderNumber);

        if (!localOrder || order.updatedAt > localOrder.updatedAt) {
            ordersByNumber.set(order.orderNumber, order);
        }
    });

    return [...ordersByNumber.values()].sort((first, second) =>
        second.createdAt.localeCompare(first.createdAt)
    );
}

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

        case 'MERGE_ORDERS':
            return mergeOrders(state, action.payload.orders);

        default:
            return state;
    }
}

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

/**
 * Envíos al Worker pendientes, encadenados para que lleguen en orden: una
 * orden se reenvía en cada cambio de estado, y una versión vieja no debe
 * llegar después de una nueva.
 */
let pendingSync: Promise<void> = Promise.resolve();

/**
 * Guarda una orden en el índice. Si la orden está confirmada y el Worker no
 * pudo descontar su stock en Algolia, se descuenta en el inventario simulado
 * de este navegador para no vender las mismas unidades otra vez.
 *
 * @param order Orden a guardar.
 */
function syncOrderToIndex(order: Order) {
    pendingSync = pendingSync.then(async () => {
        const { stockDiscounted } = await saveOrderToIndex(order);

        if (order.orderStatus !== 'CONFIRMED') {
            return;
        }

        if (stockDiscounted) {
            // Los resultados guardados en memoria tienen el stock anterior.
            await searchClient?.clearCache();
            return;
        }

        console.log(`El stock de ${order.orderNumber} no se descontó en Algolia; se descuenta localmente.`);
        discountOrderInventory(order);
    });
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
 * Proveedor que mantiene las órdenes, las persiste en localStorage y las
 * sincroniza con el índice de órdenes de Algolia.
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

    // Al iniciar, se traen las órdenes del índice (de cualquier navegador) y se combinan con las locales.
    useEffect(() => {
        loadOrdersFromIndex()
            .then((indexOrders) => {
                dispatch({ type: 'MERGE_ORDERS', payload: { orders: indexOrders } });
            })
            .catch((error: unknown) => {
                console.error('No se pudieron leer las órdenes del índice; se usan las de este navegador:', error);
            });
    }, []);

    const addOrder = (order: Order) => {
        dispatch({
            type: 'ADD_ORDER',
            payload: { order }
        });
        syncOrderToIndex(order);
    };

    const saveOrder = (order: Order) => {
        dispatch({
            type: 'SAVE_ORDER',
            payload: { order }
        });
        syncOrderToIndex(order);
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
