/**
 * @fileoverview Diálogo con la disponibilidad en cada sucursal. Si el usuario
 * puede comprar, también le permite marcar la sucursal de retiro o envío.
 */

import { useTranslation } from 'react-i18next';
import { FaStore } from 'react-icons/fa';

import { useBranch } from '../../context/BranchContext';
import { useSession } from '../../context/SessionContext';
import type { Branch } from '../../inventory/branches';
import type { StockStatus } from '../../product/productSpecifications';
import ActionDialog from '../dialog/ActionDialog';

import dialogStyles from '../dialog/ActionDialog.module.css';
import styles from './BranchPicker.module.css';

/** Disponibilidad de una sucursal, ya lista para mostrarse. */
export interface BranchStatus {
    branch: Branch;
    /** Nivel de disponibilidad; "unknown" mientras se consulta el inventario. */
    status: StockStatus | 'unknown';
    /** Texto de la etiqueta, como "Quedan 3" o "2 de 3 productos"; vacío para no mostrarla. */
    label: string;
}

/** Clase de estilo de la etiqueta de cada nivel de disponibilidad. */
const STATUS_TAG_CLASS: Record<BranchStatus['status'], string> = {
    available: styles.tagAvailable,
    lowStock: styles.tagLow,
    outOfStock: styles.tagOut,
    unknown: styles.tagUnknown
};

/** Propiedades de BranchPickerDialog. */
interface BranchPickerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** Texto bajo el título que explica qué muestra la lista. */
    description: string;
    /** Disponibilidad de cada sucursal, en el orden en que se muestra. */
    statuses: BranchStatus[];
    /** Muestra casillas para elegir la sucursal; si es falso, solo se consulta. */
    isSelectable: boolean;
    /** Texto opcional al final de la lista, como el total de unidades. */
    footnote?: string;
}

/**
 * Muestra una fila por sucursal con su etiqueta de disponibilidad. Cuando se
 * puede elegir, cada fila tiene una casilla y marcarla cambia la sucursal en
 * toda la tienda. La sucursal predeterminada del usuario se señala con una
 * etiqueta.
 *
 * @param props Propiedades del componente.
 * @return El diálogo de sucursales.
 */
export default function BranchPickerDialog({
    isOpen,
    onClose,
    description,
    statuses,
    isSelectable,
    footnote
}: BranchPickerDialogProps) {
    const { t } = useTranslation('common');
    const { selectedBranch, selectBranch } = useBranch();
    const { currentUser } = useSession();
    const defaultBranchId = currentUser?.savedAddress?.defaultBranchId;

    /**
     * Muestra el nombre de la sucursal y, si es la predeterminada, su etiqueta.
     *
     * @param branch Sucursal a mostrar.
     * @return El nombre de la sucursal.
     */
    const renderBranchName = (branch: Branch) => (
        <span className={styles.branchName}>
            {branch.name}
            {branch.id === defaultBranchId && (
                <span className={styles.defaultTag}>{t('branch.defaultTag')}</span>
            )}
        </span>
    );

    return (
        <ActionDialog
            isOpen={isOpen}
            onClose={onClose}
            icon={FaStore}
            eyebrow={t('branch.dialog.eyebrow')}
            title={t('branch.dialog.title')}
            description={description}
            actions={
                <button
                    type="button"
                    className={isSelectable ? dialogStyles.primaryAction : dialogStyles.secondaryAction}
                    onClick={onClose}
                >
                    {isSelectable ? t('branch.dialog.done') : t('branch.dialog.close')}
                </button>
            }
        >
            <ul className={styles.branchList} aria-label={t('branch.dialog.listLabel')}>
                {statuses.map(({ branch, status, label }) => {
                    const tag = label && (
                        <span className={`${styles.tag} ${STATUS_TAG_CLASS[status]}`}>{label}</span>
                    );

                    if (!isSelectable) {
                        return (
                            <li key={branch.id} className={styles.branchRow}>
                                {renderBranchName(branch)}
                                {tag}
                            </li>
                        );
                    }

                    const isChecked = selectedBranch?.id === branch.id;

                    return (
                        <li key={branch.id}>
                            <label
                                className={
                                    isChecked
                                        ? `${styles.branchRow} ${styles.branchRowSelectable} ${styles.branchRowChecked}`
                                        : `${styles.branchRow} ${styles.branchRowSelectable}`
                                }
                            >
                                <input
                                    type="radio"
                                    name="branch-picker"
                                    className={styles.radio}
                                    value={branch.id}
                                    checked={isChecked}
                                    onChange={() => selectBranch(branch.id)}
                                />
                                {renderBranchName(branch)}
                                {tag}
                            </label>
                        </li>
                    );
                })}
            </ul>

            {footnote && <p className={styles.footnote}>{footnote}</p>}
        </ActionDialog>
    );
}
