/**
 * @fileoverview Reglas de transición de los estados de una orden y de su pago.
 * Toda modificación de estado pasa por aquí para que la orden nunca quede en
 * una combinación incoherente (por ejemplo, confirmada con el pago rechazado).
 */

import type {
    Order,
    OrderEvent,
    OrderFailureReason,
    OrderStatus,
    PaymentStatus,
    ProcessedPaymentStatus
} from './orderTypes';

/** Cantidad de pagos rechazados que admite una orden antes de fallar. */
export const MAX_PAYMENT_ATTEMPTS = 3;

/** Estados de orden a los que se puede pasar desde cada estado. CONFIRMED y FAILED son finales. */
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'FAILED'],
    CONFIRMED: [],
    FAILED: []
};

/** Estados a los que puede pasar un pago que todavía no se aprobó. */
const RETRYABLE_PAYMENT_TARGETS: PaymentStatus[] = ['APPROVED', 'DECLINED', 'ERROR', 'CANCELLED'];

/** Estados de pago a los que se puede pasar desde cada estado. Un pago aprobado solo puede reembolsarse. */
const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    PENDING: RETRYABLE_PAYMENT_TARGETS,
    DECLINED: RETRYABLE_PAYMENT_TARGETS,
    ERROR: RETRYABLE_PAYMENT_TARGETS,
    APPROVED: ['REFUNDED'],
    REFUNDED: [],
    CANCELLED: []
};

/** Evento que se registra en el historial según el resultado del pago. */
const EVENT_BY_PAYMENT_STATUS: Record<ProcessedPaymentStatus, OrderEvent> = {
    APPROVED: 'PAYMENT_APPROVED',
    DECLINED: 'PAYMENT_DECLINED',
    ERROR: 'PAYMENT_ERROR'
};

/** Error lanzado al intentar un cambio de estado que las reglas no permiten. */
export class InvalidOrderTransitionError extends Error {
    /**
     * @param order Orden que se intentó modificar.
     * @param event Evento que provocaba el cambio.
     */
    constructor(order: Order, event: OrderEvent) {
        super(
            `La orden ${order.orderNumber} (${order.orderStatus}/${order.paymentStatus}) no admite el evento ${event}.`
        );
        this.name = 'InvalidOrderTransitionError';
    }
}

/**
 * Indica si un estado puede pasar a otro según una tabla de transiciones.
 * Mantener el mismo estado siempre es válido.
 *
 * @param transitions Tabla de transiciones permitidas.
 * @param from Estado actual.
 * @param to Estado nuevo.
 * @return Verdadero si el cambio está permitido.
 * @template S
 */
function canMove<S extends string>(transitions: Record<S, S[]>, from: S, to: S): boolean {
    return from === to || transitions[from].includes(to);
}

/**
 * Indica si una orden ya no puede cambiar de estado.
 *
 * @param status Estado de la orden.
 * @return Verdadero si el estado es CONFIRMED o FAILED.
 */
export const isFinalOrderStatus = (status: OrderStatus): boolean =>
    ORDER_STATUS_TRANSITIONS[status].length === 0;

/**
 * Verifica que el paso de una versión de la orden a otra respete las reglas
 * de ambos estados.
 *
 * @param previous Orden antes del cambio.
 * @param next Orden después del cambio.
 * @return Verdadero si el cambio es válido.
 */
export function isValidOrderChange(previous: Order, next: Order): boolean {
    return (
        canMove(ORDER_STATUS_TRANSITIONS, previous.orderStatus, next.orderStatus) &&
        canMove(PAYMENT_STATUS_TRANSITIONS, previous.paymentStatus, next.paymentStatus)
    );
}

/** Cambios que se aplican a una orden junto con el evento que los provoca. */
type OrderChanges = Partial<Pick<
    Order,
    | 'orderStatus'
    | 'paymentStatus'
    | 'paymentAttempts'
    | 'transactionId'
    | 'paymentMessage'
    | 'failureReason'
>>;

/**
 * Aplica un cambio a la orden y lo registra en su historial. Una orden
 * final solo admite el reembolso de su pago.
 *
 * @param order Orden actual.
 * @param event Evento que provoca el cambio.
 * @param changes Campos que cambian.
 * @param now Momento del cambio.
 * @return La orden actualizada.
 * @throws {InvalidOrderTransitionError} Si el cambio no está permitido.
 */
function transition(
    order: Order,
    event: OrderEvent,
    changes: OrderChanges,
    now: Date
): Order {
    const changedAt = now.toISOString();
    const next: Order = { ...order, ...changes, updatedAt: changedAt };
    const isClosedOrderEvent =
        isFinalOrderStatus(order.orderStatus) && event !== 'PAYMENT_REFUNDED';

    if (isClosedOrderEvent || !isValidOrderChange(order, next)) {
        throw new InvalidOrderTransitionError(order, event);
    }

    return {
        ...next,
        statusHistory: [
            ...(order.statusHistory ?? []),
            {
                changedAt,
                event,
                orderStatus: next.orderStatus,
                paymentStatus: next.paymentStatus,
                ...(event === 'ORDER_FAILED' && { failureReason: next.failureReason })
            }
        ]
    };
}

/**
 * Crea la primera entrada del historial de una orden nueva.
 *
 * @param order Orden recién creada, sin historial.
 * @return La orden con el evento CREATED registrado.
 */
export const withCreatedEntry = (order: Order): Order => ({
    ...order,
    statusHistory: [{
        changedAt: order.createdAt,
        event: 'CREATED',
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus
    }]
});

/** Resultado de un intento de pago que se registra en una orden. */
export interface PaymentUpdate {
    paymentStatus: ProcessedPaymentStatus;
    transactionId?: string;
    paymentMessage?: string;
}

/**
 * Registra un intento de pago. Un pago aprobado deja la orden en PENDING
 * hasta que se confirme; un rechazo la deja reintentable salvo que se haya
 * alcanzado MAX_PAYMENT_ATTEMPTS, en cuyo caso la orden falla.
 *
 * @param order Orden pagada.
 * @param update Resultado del intento.
 * @param now Momento del intento; por defecto, el actual.
 * @return La orden con el intento registrado.
 * @throws {InvalidOrderTransitionError} Si la orden ya no admite pagos.
 */
export function recordPaymentAttempt(
    order: Order,
    update: PaymentUpdate,
    now: Date = new Date()
): Order {
    const paymentAttempts = order.paymentAttempts + 1;

    const updated = transition(order, EVENT_BY_PAYMENT_STATUS[update.paymentStatus], {
        paymentStatus: update.paymentStatus,
        paymentAttempts,
        transactionId: update.transactionId ?? order.transactionId,
        paymentMessage: update.paymentMessage
    }, now);

    const attemptsExhausted =
        update.paymentStatus === 'DECLINED' && paymentAttempts >= MAX_PAYMENT_ATTEMPTS;

    return attemptsExhausted ? failOrder(updated, 'MAX_ATTEMPTS', now) : updated;
}

/**
 * Confirma una orden cuyo pago ya fue aprobado.
 *
 * @param order Orden con el pago aprobado.
 * @param now Momento de la confirmación; por defecto, el actual.
 * @return La orden en estado CONFIRMED.
 * @throws {InvalidOrderTransitionError} Si el pago no está aprobado o la orden ya es final.
 */
export function confirmOrder(order: Order, now: Date = new Date()): Order {
    if (order.paymentStatus !== 'APPROVED') {
        throw new InvalidOrderTransitionError(order, 'ORDER_CONFIRMED');
    }

    return transition(order, 'ORDER_CONFIRMED', { orderStatus: 'CONFIRMED' }, now);
}

/**
 * Marca una orden como fallida. Si todavía no se había cobrado (pago
 * pendiente o con error del servicio), el pago se cancela; un pago rechazado
 * o aprobado se conserva tal cual.
 *
 * @param order Orden que falló.
 * @param reason Motivo del fallo.
 * @param now Momento del fallo; por defecto, el actual.
 * @return La orden en estado FAILED.
 * @throws {InvalidOrderTransitionError} Si la orden ya es final.
 */
export function failOrder(
    order: Order,
    reason: OrderFailureReason,
    now: Date = new Date()
): Order {
    const isUncharged = order.paymentStatus === 'PENDING' || order.paymentStatus === 'ERROR';

    return transition(order, 'ORDER_FAILED', {
        orderStatus: 'FAILED',
        failureReason: reason,
        ...(isUncharged && { paymentStatus: 'CANCELLED' })
    }, now);
}

/**
 * Registra el reembolso del pago aprobado de una orden.
 *
 * @param order Orden con el pago aprobado.
 * @param now Momento del reembolso; por defecto, el actual.
 * @return La orden con el pago en estado REFUNDED.
 * @throws {InvalidOrderTransitionError} Si el pago no estaba aprobado.
 */
export function refundOrderPayment(order: Order, now: Date = new Date()): Order {
    return transition(order, 'PAYMENT_REFUNDED', { paymentStatus: 'REFUNDED' }, now);
}
