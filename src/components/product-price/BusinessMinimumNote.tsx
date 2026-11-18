/**
 * @fileoverview Aviso de la cantidad mínima de compra para empresas.
 */

import { useTranslation } from 'react-i18next';
import { FaBuilding } from 'react-icons/fa';

import { useSession } from '../../context/SessionContext';
import { getBusinessMinimum } from '../../pricing/businessMinimum';
import { usePriceTier } from '../../pricing/usePriceTier';
import { hasPermission } from '../../session/permissions';
import type { Product } from '../../utils/Products';

import styles from './ProductPrice.module.css';

/**
 * Indica cuántas unidades del producto debe comprar como mínimo una empresa.
 * Lo ven el cliente B2B, a quien se le aplica, y el administrador, que
 * consulta las condiciones comerciales. No se muestra si el mínimo es 1.
 *
 * @param props Propiedades del componente.
 * @param props.product Producto a consultar.
 * @return El aviso, o null si no corresponde mostrarlo.
 */
export default function BusinessMinimumNote({ product }: { product: Product }) {
    const { t } = useTranslation('product');
    const { currentUser } = useSession();
    const tier = usePriceTier();
    const minimum = getBusinessMinimum(product);
    const canSeeCondition = tier === 'B2B' || hasPermission(currentUser, 'VIEW_ADMIN_INFORMATION');

    if (!canSeeCondition || minimum === 1) {
        return null;
    }

    return (
        <p className={styles.tierNote}>
            <FaBuilding aria-hidden="true" />
            {t('businessMinimum', { count: minimum })}
        </p>
    );
}
