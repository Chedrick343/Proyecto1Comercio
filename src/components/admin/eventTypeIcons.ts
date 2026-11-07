/**
 * @fileoverview Ícono que representa cada tipo de evento en el panel administrativo.
 */

import type { IconType } from 'react-icons';
import {
    FaCartPlus,
    FaCreditCard,
    FaEye,
    FaSearch,
    FaShoppingBag,
    FaSignInAlt
} from 'react-icons/fa';

import type { AnalyticsEventType } from '../../activity/analyticsTypes';

/** Ícono de cada tipo de evento. */
export const EVENT_TYPE_ICONS: Record<AnalyticsEventType, IconType> = {
    LOGIN: FaSignInAlt,
    SEARCH: FaSearch,
    PRODUCT_VIEW: FaEye,
    ADD_TO_CART: FaCartPlus,
    CHECKOUT_START: FaCreditCard,
    PURCHASE: FaShoppingBag
};
