/**
 * @fileoverview Hook que coordina la creación de la orden, su validación, su
 * pago y su confirmación en el checkout.
 */

import { useRef, useState } from 'react';

import { toPurchasePayload } from '../../activity/eventPayloads';
import { useAnalytics } from '../../context/AnalyticsContext';
import { calculateCartTotals, useCart, type CartItem } from '../../context/CartContext';
import { useOrders } from '../../context/OrdersContext';
import { createOrder } from '../../orders/createOrder';
import {
    confirmOrder,
    failOrder,
    recordPaymentAttempt,
    refundOrderPayment
} from '../../orders/orderStateMachine';
import type { Order, TermsAcceptance } from '../../orders/orderTypes';
import {
    reserveOrderInventory,
    validateOrderForPayment,
    type OrderScenario
} from '../../services/orderSandbox/orderSandboxService';
import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';
import type { ShippingDetails } from './checkoutTypes';
import {
    PAYMENT_STATUS_BY_RESULT,
    submitPayment,
    submitRefund,
    type PaymentResult
} from './paymentGateway';

/** Etapa del proceso de compra que está en curso. */
export type CheckoutStage = 'validating' | 'paying' | 'confirming' | 'refunding';

/** Escenarios que deben reproducir los servicios simulados. */
export interface SandboxScenarios {
    payment: SandboxScenario;
    order: OrderScenario;
}

/**
 * Crea la orden en el primer intento de pago y la reutiliza en los
 * reintentos. Cada intento valida la orden, la cobra y, si el pago se
 * aprueba, reserva el inventario para confirmarla. Al confirmarse, solo se
 * descuentan del carrito los productos comprados, así que lo que no se pudo
 * comprar queda para otro pedido. Si la orden falla después de cobrarse,
 * solicita el reembolso.
 *
 * @return El estado del proceso y las acciones para pagar, limpiar el
 *     resultado, descartar la orden activa o empezar una orden nueva.
 */
export function useOrderPayment() {
    const { removePurchasedItems } = useCart();
    const { addOrder, saveOrder } = useOrders();
    const { track } = useAnalytics();

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
    const [processingStage, setProcessingStage] = useState<CheckoutStage | null>(null);

    /** Bloquea los dobles clics que ocurren antes de que el botón se deshabilite. */
    const isSubmittingRef = useRef(false);

    const failedOrder = activeOrder?.orderStatus === 'FAILED' ? activeOrder : null;

    /**
     * Guarda una nueva versión de la orden activa.
     *
     * @param order Orden actualizada.
     */
    const updateActiveOrder = (order: Order) => {
        saveOrder(order);
        setActiveOrder(order);
    };

    /**
     * Devuelve la orden activa, o la crea y registra si aún no existe.
     *
     * @param customer Datos de envío del cliente.
     * @param termsAcceptance Constancia de aceptación de términos.
     * @param orderItems Productos que se van a comprar.
     * @return La orden a pagar.
     */
    const getOrCreateOrder = (
        customer: ShippingDetails,
        termsAcceptance: TermsAcceptance,
        orderItems: CartItem[]
    ): Order => {
        if (activeOrder) {
            return activeOrder;
        }

        const newOrder = createOrder({
            cart: orderItems,
            totals: calculateCartTotals(orderItems),
            customer,
            termsAcceptance
        });

        console.log('Orden creada con los productos:', newOrder.items);

        addOrder(newOrder);
        setActiveOrder(newOrder);

        return newOrder;
    };

    /**
     * Reserva el inventario de una orden pagada y la confirma. Si la reserva
     * falla, marca la orden como fallida y reembolsa el pago.
     *
     * @param paidOrder Orden con el pago aprobado.
     * @param orderScenario Escenario del servicio de órdenes.
     */
    const confirmPaidOrder = async (paidOrder: Order, orderScenario: OrderScenario) => {
        setProcessingStage('confirming');

        if (await reserveOrderInventory(paidOrder, orderScenario)) {
            const confirmedOrder = confirmOrder(paidOrder);

            updateActiveOrder(confirmedOrder);
            setConfirmedOrderNumber(confirmedOrder.orderNumber);
            track('PURCHASE', toPurchasePayload(confirmedOrder));
            removePurchasedItems(
                confirmedOrder.items.map((item) => ({ id: item.productId, quantity: item.quantity }))
            );
            return;
        }

        const unconfirmedOrder = failOrder(paidOrder, 'CONFIRMATION_ERROR');

        setProcessingStage('refunding');

        const isRefunded = await submitRefund({
            transactionId: unconfirmedOrder.transactionId ?? '',
            orderId: unconfirmedOrder.orderNumber,
            amount: unconfirmedOrder.total,
            currency: unconfirmedOrder.currency
        });

        // The failure is saved only after the refund attempt so the notice never shows a stale payment state.
        updateActiveOrder(isRefunded ? refundOrderPayment(unconfirmedOrder) : unconfirmedOrder);
    };

    /**
     * Valida, cobra y confirma la orden. Se ignora si ya hay un proceso en
     * curso o si la orden ya terminó (confirmada o fallida).
     *
     * @param customer Datos de envío del cliente.
     * @param termsAcceptance Constancia de aceptación de términos.
     * @param scenarios Escenarios que deben reproducir los servicios simulados.
     * @param orderItems Productos que se van a comprar: todo el carrito o
     *     solo lo disponible en la sucursal elegida.
     */
    const payOrder = async (
        customer: ShippingDetails,
        termsAcceptance: TermsAcceptance,
        scenarios: SandboxScenarios,
        orderItems: CartItem[]
    ) => {
        if (isSubmittingRef.current || confirmedOrderNumber || failedOrder) {
            return;
        }

        isSubmittingRef.current = true;
        setProcessingStage('validating');
        setPaymentResult(null);

        try {
            const order = getOrCreateOrder(customer, termsAcceptance, orderItems);

            const validationFailure = await validateOrderForPayment(order, scenarios.order);

            if (validationFailure) {
                updateActiveOrder(failOrder(order, validationFailure));
                return;
            }

            setProcessingStage('paying');

            const paymentOutcome = await submitPayment(
                {
                    orderId: order.orderNumber,
                    amount: order.total,
                    currency: order.currency
                },
                scenarios.payment
            );

            const paidOrder = recordPaymentAttempt(order, {
                paymentStatus: PAYMENT_STATUS_BY_RESULT[paymentOutcome.result],
                transactionId: paymentOutcome.transactionId,
                paymentMessage: paymentOutcome.providerMessage
            });

            updateActiveOrder(paidOrder);
            setPaymentResult(paymentOutcome.result);

            if (paymentOutcome.result === 'PAYMENT_APPROVED') {
                await confirmPaidOrder(paidOrder, scenarios.order);
            }
        } catch (error) {
            console.error('No se pudo completar el pago de la orden:', error);
            setPaymentResult('PAYMENT_ERROR');
        } finally {
            isSubmittingRef.current = false;
            setProcessingStage(null);
        }
    };

    /** Oculta el resultado del último intento de pago. */
    const clearPaymentResult = () => setPaymentResult(null);

    /**
     * Olvida la orden activa para que el próximo pago cree una nueva (por
     * ejemplo, cuando el cliente modifica sus datos o la orden anterior falló).
     */
    const discardActiveOrder = () => {
        setActiveOrder(null);
        setPaymentResult(null);
    };

    return {
        paymentResult,
        processingStage,
        isProcessingPayment: processingStage !== null,
        paymentAttempts: activeOrder?.paymentAttempts ?? 0,
        failedOrder,
        confirmedOrderNumber,
        payOrder,
        clearPaymentResult,
        discardActiveOrder
    };
}
