/**
 * @fileoverview Aviso de que el carrito tiene precios de empresa.
 */

import { useTranslation } from 'react-i18next';
import { FaBuilding } from 'react-icons/fa';

import { useCart } from '../../context/CartContext';

import styles from './ProductPrice.module.css';

/**
 * Indica que los precios del carrito son de empresa (B2B). Para el resto de
 * los clientes no muestra nada, porque el precio B2C es el habitual.
 *
 * @return El aviso, o null si los precios son B2C.
 */
export default function PriceTierNote() {
    const { t } = useTranslation('product');
    const { priceTier } = useCart();

    if (priceTier !== 'B2B') {
        return null;
    }

    return (
        <p className={styles.tierNote}>
            <FaBuilding aria-hidden="true" />
            {t('price.businessCartNote')}
        </p>
    );
}
