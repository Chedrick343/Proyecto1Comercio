/**
 * @fileoverview Hook que coordina la creación de la orden y su pago en el checkout.
 */

import { useRef, useState } from 'react';

import { toPurchasePayload } from '../../activity/eventPayloads';
import { useAnalytics } from '../../context/AnalyticsContext';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrdersContext';
import { createOrder } from '../../orders/createOrder';
import type { Order, TermsAcceptance } from '../../orders/orderTypes';
import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';
import type { ShippingDetails } from './checkoutTypes';
import {
    PAYMENT_STATUS_BY_RESULT,
    submitPayment,
    type PaymentResult
} from './paymentGateway';

/**
 * Crea la orden en el primer intento de pago y la reutiliza en los
 * reintentos. Si el pago se aprueba, confirma la orden y vacía el carrito.
 *
 * @return El estado del pago y las acciones para pagar, limpiar el
 *     resultado o descartar la orden activa.
 */
export function useOrderPayment() {
    const { cart, subtotal, iva, shipping, total, clearCart } = useCart();
    const { addOrder, updateOrderPayment } = useOrders();
    const { track } = useAnalytics();

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    /** Bloquea los dobles clics que ocurren antes de que el botón se deshabilite. */
    const isSubmittingRef = useRef(false);

    /**
     * Devuelve la orden activa, o la crea y registra si aún no existe.
     *
     * @param customer Datos de envío del cliente.
     * @param termsAcceptance Constancia de aceptación de términos.
     * @return La orden a pagar.
     */
    const getOrCreateOrder = (
        customer: ShippingDetails,
        termsAcceptance: TermsAcceptance
    ): Order => {
        if (activeOrder) {
            return activeOrder;
        }

        const newOrder = createOrder({
            cart,
            totals: { subtotal, iva, shipping, total },
            customer,
            termsAcceptance
        });

        addOrder(newOrder);
        setActiveOrder(newOrder);

        return newOrder;
    };

    /**
     * Paga la orden. Se ignora si ya hay un pago en curso o la orden ya fue confirmada.
     *
     * @param customer Datos de envío del cliente.
     * @param termsAcceptance Constancia de aceptación de términos.
     * @param scenario Escenario que debe reproducir la pasarela simulada.
     */
    const payOrder = async (
        customer: ShippingDetails,
        termsAcceptance: TermsAcceptance,
        scenario: SandboxScenario
    ) => {
        if (isSubmittingRef.current || confirmedOrderNumber) {
            return;
        }

        isSubmittingRef.current = true;
        setIsProcessingPayment(true);
        setPaymentResult(null);

        try {
            const order = getOrCreateOrder(customer, termsAcceptance);

            const paymentOutcome = await submitPayment(
                {
                    orderId: order.orderNumber,
                    amount: order.total,
                    currency: order.currency
                },
                scenario
            );

            updateOrderPayment(order.orderNumber, {
                paymentStatus: PAYMENT_STATUS_BY_RESULT[paymentOutcome.result],
                transactionId: paymentOutcome.transactionId,
                paymentMessage: paymentOutcome.providerMessage
            });

            setPaymentResult(paymentOutcome.result);

            if (paymentOutcome.result === 'PAYMENT_APPROVED') {
                setConfirmedOrderNumber(order.orderNumber);
                track('PURCHASE', toPurchasePayload(order));
                clearCart();
            }
        } catch (error) {
            console.error('No se pudo completar el pago de la orden:', error);
            setPaymentResult('PAYMENT_ERROR');
        } finally {
            isSubmittingRef.current = false;
            setIsProcessingPayment(false);
        }
    };

    /** Oculta el resultado del último intento de pago. */
    const clearPaymentResult = () => setPaymentResult(null);

    /**
     * Olvida la orden activa para que el próximo pago cree una nueva (por
     * ejemplo, cuando el cliente modifica sus datos tras un intento fallido).
     */
    const discardActiveOrder = () => {
        setActiveOrder(null);
        setPaymentResult(null);
    };

    return {
        paymentResult,
        isProcessingPayment,
        confirmedOrderNumber,
        payOrder,
        clearPaymentResult,
        discardActiveOrder
    };
}
