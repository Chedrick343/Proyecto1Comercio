/**
 * @fileoverview Precio de un producto según el tipo de cliente que usa la tienda.
 */

import { useTranslation } from 'react-i18next';

import { useSession } from '../../context/SessionContext';
import {
    getBusinessSavingsPercent,
    getCustomerPrice
} from '../../pricing/customerPrice';
import { usePriceTier } from '../../pricing/usePriceTier';
import { hasPermission } from '../../session/permissions';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Product } from '../../utils/Products';

import styles from './ProductPrice.module.css';

/** Propiedades de ProductPrice. */
interface ProductPriceProps {
    product: Product;
    /** Clase del precio principal, para conservar el estilo de cada página. */
    priceClassName: string;
    /** Muestra también el ahorro frente al precio B2C (en el detalle). */
    showSavings?: boolean;
}

/**
 * Muestra el precio que le corresponde al usuario actual:
 * - Cliente B2B: el precio de empresa, con el precio B2C tachado.
 * - Administrador: el precio B2C y, debajo, el B2B, porque consulta ambos.
 * - Invitado y cliente B2C: el precio B2C.
 * Si la información comercial no es válida, avisa que el precio no está
 * disponible.
 *
 * @param props Propiedades del componente.
 * @return El precio del producto.
 */
export default function ProductPrice({ product, priceClassName, showSavings = false }: ProductPriceProps) {
    const { t } = useTranslation('product');
    const { currentUser } = useSession();
    const tier = usePriceTier();
    const price = getCustomerPrice(product, tier);
    const canSeeAllPrices = hasPermission(currentUser, 'VIEW_ADMIN_INFORMATION');

    if (price.problem) {
        return <p className={styles.unavailable}>{t('price.unavailable')}</p>;
    }

    if (canSeeAllPrices) {
        return (
            <div className={styles.priceGroup}>
                <p className={priceClassName}>{formatCurrency(price.amount, price.currency)}</p>
                <p className={styles.secondaryPrice}>
                    {t('price.businessPriceForAdmin', {
                        price: formatCurrency(product.b2b.price, product.b2b.currency)
                    })}
                </p>
            </div>
        );
    }

    if (tier === 'B2C') {
        return <p className={priceClassName}>{formatCurrency(price.amount, price.currency)}</p>;
    }

    const savingsPercent = getBusinessSavingsPercent(product);

    return (
        <div className={styles.priceGroup}>
            <span className={styles.tierTag}>{t('price.businessTag')}</span>
            <p className={priceClassName}>{formatCurrency(price.amount, price.currency)}</p>

            {savingsPercent > 0 && (
                <p className={styles.retailPrice}>
                    <s>{formatCurrency(product.b2c.price, product.b2c.currency)}</s>
                    {showSavings && (
                        <span className={styles.savings}>
                            {t('price.savings', { percent: savingsPercent })}
                        </span>
                    )}
                </p>
            )}
        </div>
    );
}
