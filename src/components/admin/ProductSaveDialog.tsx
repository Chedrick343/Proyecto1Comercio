/**
 * @fileoverview Modal que acompaña el guardado de un producto en Algolia:
 * muestra que la operación está en curso y, al terminar, el resultado.
 */

import { useTranslation } from 'react-i18next';
import { FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

import type { FieldChange } from '../../services/productChanges/productChangesService';
import ActionDialog from '../dialog/ActionDialog';
import { formatFieldValue, getFieldName } from './productEditLabels';

import dialogStyles from '../dialog/ActionDialog.module.css';
import styles from './ProductEdit.module.css';

/** Estado del guardado que muestra el modal. */
export type SaveStatus = 'saving' | 'saved' | 'failed';

/**
 * Ícono de carga que gira mientras se espera la respuesta.
 *
 * @return El ícono animado.
 */
function SpinnerIcon() {
    return <FaSpinner className={styles.spinner} />;
}

/**
 * Muestra la lista de datos guardados, cada uno con su valor anterior y el
 * nuevo.
 *
 * @param props Propiedades del componente.
 * @param props.changes Cambios guardados.
 * @param props.currency Moneda de los precios del producto.
 * @return La lista de cambios.
 */
function SavedChangesList({ changes, currency }: { changes: FieldChange[]; currency: string }) {
    const { t } = useTranslation('admin');

    return (
        <ul className={styles.changeList}>
            {changes.map((change) => (
                <li key={`${change.field}-${change.branchId ?? ''}`} className={styles.changeItem}>
                    <span className={styles.changeField}>{getFieldName(change.field, change.branchId, t)}</span>
                    <span className={styles.changeValues}>
                        <span className={styles.changePrevious}>
                            {formatFieldValue(change.field, change.previousValue, currency, t)}
                        </span>
                        <span aria-hidden="true">→</span>
                        <span className={styles.changeNext}>
                            {formatFieldValue(change.field, change.newValue, currency, t)}
                        </span>
                    </span>
                </li>
            ))}
        </ul>
    );
}

/** Propiedades de ProductSaveDialog. */
interface ProductSaveDialogProps {
    /** Estado del guardado, o null si el modal está cerrado. */
    status: SaveStatus | null;
    productTitle: string;
    /** Cambios enviados; se muestran cuando el guardado termina bien. */
    changes: FieldChange[];
    currency: string;
    /** Motivo del error, cuando el guardado falla. */
    errorMessage: string | null;
    onClose: () => void;
}

/**
 * Muestra el progreso y el resultado de guardar un producto en un mismo
 * modal, que cambia de contenido sin cerrarse. Mientras se espera al Worker
 * no se puede cerrar; al terminar muestra qué cambió o por qué no se pudo
 * guardar.
 *
 * @param props Propiedades del componente.
 * @return El modal.
 */
export default function ProductSaveDialog({
    status,
    productTitle,
    changes,
    currency,
    errorMessage,
    onClose
}: ProductSaveDialogProps) {
    const { t } = useTranslation('admin');
    const isSaving = status === 'saving';
    const hasFailed = status === 'failed';

    let eyebrow = t('products.editing.saveDialog.savingEyebrow');
    let title = t('products.editing.saveDialog.savingTitle');
    let description: string | undefined = t('products.editing.saveDialog.savingDescription', { name: productTitle });

    if (hasFailed) {
        eyebrow = t('products.editing.saveDialog.failedEyebrow');
        title = t('products.editing.saveDialog.failedTitle');
        description = errorMessage ?? undefined;
    } else if (status === 'saved') {
        eyebrow = t('products.editing.saveDialog.savedEyebrow');
        title = t('products.editing.saved', { count: changes.length });
        description = t('products.editing.saveDialog.savedDescription', { name: productTitle });
    }

    return (
        <ActionDialog
            isOpen={status !== null}
            onClose={onClose}
            isDismissible={!isSaving}
            icon={isSaving ? SpinnerIcon : hasFailed ? FaExclamationTriangle : FaCheck}
            tone={hasFailed ? 'danger' : 'accent'}
            eyebrow={eyebrow}
            title={title}
            description={description}
            actions={isSaving ? null : hasFailed ? (
                <button type="button" className={dialogStyles.secondaryAction} onClick={onClose}>
                    {t('products.editing.saveDialog.failedAction')}
                </button>
            ) : (
                <button type="button" className={dialogStyles.primaryAction} onClick={onClose}>
                    {t('products.editing.done')}
                </button>
            )}
        >
            {status === 'saved' && <SavedChangesList changes={changes} currency={currency} />}
        </ActionDialog>
    );
}
