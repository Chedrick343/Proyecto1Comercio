/**
 * @fileoverview Aviso con las unidades de un producto en la sucursal
 * predeterminada del usuario, como dato informativo en el detalle.
 */

import { useTranslation } from 'react-i18next';

import { useSession } from '../../context/SessionContext';
import { getBranchStock, getStockByBranch } from '../../inventory/branchInventory';
import { findBranchById } from '../../inventory/branches';
import { getStockStatusForUnits, type StockStatus } from '../../product/productSpecifications';
import type { Product } from '../../utils/Products';

import styles from './BranchPicker.module.css';

/** Clase de estilo del aviso según el nivel de disponibilidad. */
const NOTE_CLASS: Record<StockStatus, string> = {
    available: styles.noteAvailable,
    lowStock: styles.noteLow,
    outOfStock: styles.noteOut
};

/**
 * Indica cuántas unidades del producto hay en la sucursal predeterminada de la
 * dirección guardada del usuario. Si no hay, menciona las sucursales que sí
 * tienen. No muestra nada si el usuario no tiene sucursal predeterminada.
 *
 * @param props Propiedades del componente.
 * @param props.product Producto a consultar.
 * @return El aviso, o null si no hay sucursal predeterminada.
 */
export default function DefaultBranchStockNote({ product }: { product: Product }) {
    const { t } = useTranslation('common');
    const { currentUser } = useSession();
    const defaultBranchId = currentUser?.savedAddress?.defaultBranchId;
    const defaultBranch = defaultBranchId ? findBranchById(defaultBranchId) : undefined;

    if (!defaultBranch) {
        return null;
    }

    const stock = getBranchStock(product, defaultBranch.id);
    const status = getStockStatusForUnits(stock);

    if (status !== 'outOfStock') {
        return (
            <p className={`${styles.note} ${NOTE_CLASS[status]}`}>
                {t('branch.unitsAtDefaultBranch', { count: stock, branch: defaultBranch.name })}
            </p>
        );
    }

    const otherBranchNames = getStockByBranch(product)
        .filter((branchStock) => branchStock.stock > 0)
        .map((branchStock) => branchStock.branch.name);

    return (
        <p className={`${styles.note} ${styles.noteOut}`}>
            {t('branch.noUnitsAtDefaultBranch', { branch: defaultBranch.name })}
            {otherBranchNames.length > 0 && (
                <span className={styles.otherBranches}>
                    {t('branch.availableAt', { branches: otherBranchNames.join(', ') })}
                </span>
            )}
        </p>
    );
}
