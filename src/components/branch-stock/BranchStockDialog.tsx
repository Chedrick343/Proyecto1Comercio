/**
 * @fileoverview Diálogo con las unidades de un producto en cada sucursal.
 */

import { useTranslation } from 'react-i18next';
import { FaStore } from 'react-icons/fa';

import { getStockByBranch } from '../../inventory/branchInventory';
import { getStockStatusForUnits, type StockStatus } from '../../product/productSpecifications';
import type { Product } from '../../utils/Products';
import ActionDialog from '../dialog/ActionDialog';

import dialogStyles from '../dialog/ActionDialog.module.css';
import styles from './BranchStockDialog.module.css';

/** Clase de estilo de la etiqueta de cada nivel de disponibilidad. */
const STOCK_TAG_CLASS: Record<StockStatus, string> = {
    available: styles.tagAvailable,
    lowStock: styles.tagLow,
    outOfStock: styles.tagOut
};

/** Propiedades de BranchStockDialog. */
interface BranchStockDialogProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Muestra una fila por sucursal con sus unidades del producto y el total de
 * todas las sucursales.
 *
 * @param props Propiedades del componente.
 * @return El diálogo de disponibilidad por sucursal.
 */
export default function BranchStockDialog({ product, isOpen, onClose }: BranchStockDialogProps) {
    const { t } = useTranslation('product');
    const stockByBranch = getStockByBranch(product);

    return (
        <ActionDialog
            isOpen={isOpen}
            onClose={onClose}
            icon={FaStore}
            eyebrow={t('branchStock.eyebrow')}
            title={t('branchStock.title')}
            description={t('branchStock.description', { name: product.title })}
            actions={
                <button type="button" className={dialogStyles.secondaryAction} onClick={onClose}>
                    {t('branchStock.close')}
                </button>
            }
        >
            <ul className={styles.branchList} aria-label={t('branchStock.listLabel')}>
                {stockByBranch.map(({ branch, stock }) => {
                    const status = getStockStatusForUnits(stock);

                    return (
                        <li key={branch.id} className={styles.branchRow}>
                            <span className={styles.branchName}>{branch.name}</span>
                            <span className={`${styles.tag} ${STOCK_TAG_CLASS[status]}`}>
                                {t(`branchStock.${status}`, { count: stock })}
                            </span>
                        </li>
                    );
                })}
            </ul>

            <p className={styles.total}>
                {t('branchStock.total', { count: product.stock_quantity })}
            </p>
        </ActionDialog>
    );
}
