/**
 * @fileoverview Creación de órdenes a partir del carrito y los datos del checkout.
 */

import type { CartItem } from '../context/CartContext';
import type { ShippingDetails } from '../components/checkout/checkoutTypes';
import { isValidPriceAmount, type PriceTier } from '../pricing/customerPrice';
import type {
    Order,
    OrderBranch,
    OrderBuyer,
    OrderItem,
    OrderTotals,
    TermsAcceptance
} from './orderTypes';
import { withCreatedEntry } from './orderStateMachine';

/** Moneda usada cuando el carrito no indica ninguna. */
const DEFAULT_CURRENCY = 'CRC';

/**
 * Obtiene la moneda en la que se cobra el carrito.
 *
 * @param cart Productos del carrito.
 * @return La moneda del primer producto, o la moneda por defecto si está vacío.
 */
export const getCartCurrency = (cart: CartItem[]): string =>
    cart[0]?.currency ?? DEFAULT_CURRENCY;

/**
 * Genera un número de orden con la fecha y un sufijo aleatorio.
 *
 * @param date Fecha de la orden; por defecto, el momento actual.
 * @return Un número de orden con el formato ORD-AAAAMMDD-XXXXXX.
 */
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

/**
 * Convierte un producto del carrito en una línea de la orden.
 *
 * @param item Producto del carrito.
 * @return La línea de la orden con su subtotal calculado.
 */
function toOrderItem(item: CartItem): OrderItem {
    return {
        productId: item.id,
        name: item.name,
        image: item.image,
        unitPrice: item.price,
        priceTier: item.priceTier,
        currency: item.currency,
        quantity: item.quantity,
        lineSubtotal: item.price * item.quantity
    };
}

/** Datos necesarios para crear una orden. */
interface CreateOrderInput {
    cart: CartItem[];
    totals: OrderTotals;
    /** Tipo de precio con el que se hace la compra. */
    priceTier: PriceTier;
    /** Quién hace la compra. */
    buyer: OrderBuyer;
    /** Sucursal de retiro o envío elegida en el checkout. */
    branch: OrderBranch;
    /** Indica si se compra solo lo disponible y el resto queda en el carrito. */
    isPartialPurchase: boolean;
    customer: ShippingDetails;
    termsAcceptance: TermsAcceptance;
}

/**
 * Crea una orden pendiente de pago. Los totales y los precios se toman del
 * carrito para que la orden coincida con el resumen que revisó el cliente.
 * Además guarda quién compró, desde qué sucursal y en qué condiciones.
 *
 * @param input Carrito, totales, condiciones comerciales, comprador,
 *     sucursal, datos de envío y aceptación de términos.
 * @return La nueva orden en estado PENDING, sin intentos de pago y con el
 *     evento CREATED en su historial.
 * @throws {Error} Si el carrito está vacío o algún producto no tiene un
 *     precio válido.
 */
export function createOrder({
    cart,
    totals,
    priceTier,
    buyer,
    branch,
    isPartialPurchase,
    customer,
    termsAcceptance
}: CreateOrderInput): Order {
    if (cart.length === 0) {
        throw new Error('No se puede crear una orden con el carrito vacío.');
    }

    const itemWithInvalidPrice = cart.find((item) => !isValidPriceAmount(item.price));

    if (itemWithInvalidPrice) {
        throw new Error(`El producto ${itemWithInvalidPrice.id} no tiene un precio válido.`);
    }

    const now = new Date();
    const timestamp = now.toISOString();

    return withCreatedEntry({
        orderNumber: generateOrderNumber(now),
        createdAt: timestamp,
        updatedAt: timestamp,
        currency: getCartCurrency(cart),
        userId: buyer.userId,
        buyer: { ...buyer },
        branch: { ...branch },
        priceTier,
        isPartialPurchase,
        customer: { ...customer },
        termsAcceptance: { ...termsAcceptance },
        items: cart.map(toOrderItem),
        subtotal: totals.subtotal,
        iva: totals.iva,
        shipping: totals.shipping,
        total: totals.total,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        paymentAttempts: 0
    });
}
