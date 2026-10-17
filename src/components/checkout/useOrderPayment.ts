import { useRef, useState } from 'react';

import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrdersContext';
import { createOrder } from '../../orders/createOrder';
import type { Order } from '../../orders/orderTypes';
import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';
import type { ShippingDetails } from './checkoutTypes';
import {
    PAYMENT_STATUS_BY_RESULT,
    submitPayment,
    type PaymentResult
} from './paymentGateway';

export function useOrderPayment() {
    const { cart, subtotal, iva, shipping, total, clearCart } = useCart();
    const { addOrder, updateOrderPayment } = useOrders();

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Blocks double clicks that happen before the disabled button re-renders.
    const isSubmittingRef = useRef(false);

    const getOrCreateOrder = (customer: ShippingDetails): Order => {
        if (activeOrder) {
            return activeOrder;
        }

        const newOrder = createOrder({
            cart,
            totals: { subtotal, iva, shipping, total },
            customer
        });

        addOrder(newOrder);
        setActiveOrder(newOrder);

        return newOrder;
    };

    const payOrder = async (
        customer: ShippingDetails,
        scenario: SandboxScenario
    ) => {
        if (isSubmittingRef.current || confirmedOrderNumber) {
            return;
        }

        isSubmittingRef.current = true;
        setIsProcessingPayment(true);
        setPaymentResult(null);

        try {
            const order = getOrCreateOrder(customer);

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

    const clearPaymentResult = () => setPaymentResult(null);

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
