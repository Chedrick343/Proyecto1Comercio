import type { CartItem } from '../context/CartContext';
import type { ShippingDetails } from '../components/checkout/checkoutTypes';
import type { Order, OrderItem, OrderTotals } from './orderTypes';

const DEFAULT_CURRENCY = 'CRC';

export function generateOrderNumber(date: Date = new Date()): string {
    const datePart = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
    ].join('');

    const randomPart = Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()
        .padEnd(6, '0');

    return `ORD-${datePart}-${randomPart}`;
}

function toOrderItem(item: CartItem): OrderItem {
    return {
        productId: item.id,
        name: item.name,
        image: item.image,
        unitPrice: item.price,
        currency: item.currency,
        quantity: item.quantity,
        lineSubtotal: item.price * item.quantity
    };
}

interface CreateOrderInput {
    cart: CartItem[];
    totals: OrderTotals;
    customer: ShippingDetails;
}

// Totals come from the cart so the order matches the summary the customer reviewed.
export function createOrder({
    cart,
    totals,
    customer
}: CreateOrderInput): Order {
    if (cart.length === 0) {
        throw new Error('No se puede crear una orden con el carrito vacío.');
    }

    const now = new Date();
    const timestamp = now.toISOString();

    return {
        orderNumber: generateOrderNumber(now),
        createdAt: timestamp,
        updatedAt: timestamp,
        currency: cart[0]?.currency ?? DEFAULT_CURRENCY,
        customer: { ...customer },
        items: cart.map(toOrderItem),
        subtotal: totals.subtotal,
        iva: totals.iva,
        shipping: totals.shipping,
        total: totals.total,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        paymentAttempts: 0
    };
}
