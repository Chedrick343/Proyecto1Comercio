/**
 * @fileoverview Detalle de un producto en la fila expandida del panel: las
 * unidades por sucursal y, para el administrador, la edición de precios,
 * mínimo B2B e inventario, que se guarda en Algolia por medio del Worker,
 * con un modal que muestra el progreso y el resultado.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPen } from 'react-icons/fa';

import { useSession } from '../../context/SessionContext';
import { getStockByBranch } from '../../inventory/branchInventory';
import { getStockStatusForUnits, type StockStatus } from '../../product/productSpecifications';
import { saveProductChanges, type FieldChange } from '../../services/productChanges/productChangesService';
import { hasPermission } from '../../session/permissions';
import type { Product } from '../../utils/Products';
import ProductEditForm from './ProductEditForm';
import ProductSaveDialog, { type SaveStatus } from './ProductSaveDialog';

import editStyles from './ProductEdit.module.css';
import styles from './AdminTable.module.css';

/** Clase de estilo de la etiqueta de cada nivel de disponibilidad. */
const STOCK_TAG_CLASS: Record<StockStatus, string> = {
    available: styles.tagOk,
    lowStock: styles.tagWarning,
    outOfStock: styles.tagProblem
};

/**
 * Muestra las unidades de un producto en cada sucursal: el nombre de la
 * sucursal arriba y sus unidades abajo, con el total del producto en el
 * encabezado.
 *
 * @param props Propiedades del componente.
 * @param props.product Producto a mostrar.
 * @return El encabezado y la lista de sucursales.
 */
function BranchStockDetail({ product }: { product: Product }) {
    const { t } = useTranslation('admin');

    return (
        <>
            <div className={styles.branchDetailHeader}>
                <span className={styles.branchDetailTitle}>{t('products.branchStockTitle')}</span>
                <span className={styles.branchDetailTotal}>
                    {t('products.totalStockLabel')}
                    <span className={`${styles.tag} ${STOCK_TAG_CLASS[getStockStatusForUnits(product.stock_quantity)]}`}>
                        {t('products.units', { count: product.stock_quantity })}
                    </span>
                </span>
            </div>
            <ul className={styles.branchStockList}>
                {getStockByBranch(product).map(({ branch, stock }) => (
                    <li key={branch.id} className={styles.branchStockItem}>
                        <span className={styles.branchName}>{branch.name}</span>
                        <span className={`${styles.tag} ${STOCK_TAG_CLASS[getStockStatusForUnits(stock)]}`}>
                            {t('products.units', { count: stock })}
                        </span>
                    </li>
                ))}
            </ul>
        </>
    );
}

/** Propiedades de AdminProductDetail. */
interface AdminProductDetailProps {
    product: Product;
    /** Se llama después de guardar, para recargar el catálogo. */
    onProductChanged: () => void;
}

/**
 * Muestra el detalle de un producto. El administrador puede editar sus
 * precios, su mínimo B2B y sus unidades por sucursal; mientras los cambios se
 * guardan en Algolia se muestra un modal de carga, y al terminar el mismo
 * modal muestra qué cambió o por qué no se pudo guardar.
 *
 * @param props Propiedades del componente.
 * @return El detalle del producto.
 */
export default function AdminProductDetail({ product, onProductChanged }: AdminProductDetailProps) {
    const { t } = useTranslation('admin');
    const { currentUser } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
    const [sentChanges, setSentChanges] = useState<FieldChange[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const canEdit = hasPermission(currentUser, 'EDIT_STORE_DATA');
    const adminEmail = currentUser?.email ?? '';

    /**
     * Guarda los cambios del formulario en Algolia. Si se guardan, cierra el
     * formulario; si no, lo deja abierto para corregir o intentar de nuevo.
     *
     * @param changes Cambios a guardar.
     */
    const handleSave = async (changes: FieldChange[]) => {
        setSentChanges(changes);
        setSaveStatus('saving');
        const result = await saveProductChanges(product.objectID, changes, adminEmail);

        if (!result.saved) {
            setErrorMessage(
                result.sessionExpired
                    ? t('products.editing.sessionExpired')
                    : result.errorMessage ?? t('products.editing.saveFailed')
            );
            setSaveStatus('failed');
            return;
        }

        setIsEditing(false);
        setSaveStatus('saved');
        onProductChanged();
    };

    /** Cierra el modal del resultado; mientras se guarda no se puede cerrar. */
    const handleCloseSaveDialog = () => {
        if (saveStatus !== 'saving') {
            setSaveStatus(null);
            setErrorMessage(null);
        }
    };

    return (
        <div className={styles.branchDetail}>
            {isEditing ? (
                <ProductEditForm
                    product={product}
                    isSaving={saveStatus === 'saving'}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <>
                    <BranchStockDetail product={product} />

                    {canEdit && (
                        <div className={editStyles.detailActions}>
                            <button
                                type="button"
                                className={editStyles.primaryButton}
                                onClick={() => setIsEditing(true)}
                            >
                                <FaPen aria-hidden="true" />
                                {t('products.editing.edit')}
                            </button>
                        </div>
                    )}
                </>
            )}

            <ProductSaveDialog
                status={saveStatus}
                productTitle={product.title}
                changes={sentChanges}
                currency={product.b2c.currency}
                errorMessage={errorMessage}
                onClose={handleCloseSaveDialog}
            />
        </div>
    );
}
