/**
 * @fileoverview Tarjeta con la sucursal de retiro o envío elegida y un botón
 * para ver la disponibilidad en cada sucursal y cambiarla.
 */

import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStore } from 'react-icons/fa';

import { useBranch } from '../../context/BranchContext';
import BranchPickerDialog, { type BranchStatus } from './BranchPickerDialog';

import styles from './BranchPicker.module.css';

/** Propiedades de BranchPicker. */
interface BranchPickerProps {
    /** Identificador del botón, para enfocarlo si el campo tiene un error. */
    id: string;
    /** Disponibilidad de cada sucursal que se muestra en el diálogo. */
    statuses: BranchStatus[];
    /** Texto del diálogo que explica qué muestra la lista. */
    dialogDescription: string;
    /** Texto opcional al final de la lista del diálogo. */
    dialogFootnote?: string;
    /** Contenido bajo la sucursal elegida, como su disponibilidad. */
    children?: ReactNode;
    /** Agrega un asterisco a la etiqueta para indicar que es obligatoria. */
    isRequired?: boolean;
    /** Marca el campo como inválido, por ejemplo si es obligatorio y está vacío. */
    hasError?: boolean;
    /** Mensaje que se muestra cuando hasError es verdadero. */
    errorMessage?: string;
}

/**
 * Muestra la sucursal elegida, o un aviso si todavía no hay una, y abre el
 * diálogo de sucursales para elegirla viendo su disponibilidad.
 *
 * @param props Propiedades del componente.
 * @return La tarjeta de la sucursal.
 */
export default function BranchPicker({
    id,
    statuses,
    dialogDescription,
    dialogFootnote,
    children,
    isRequired = false,
    hasError = false,
    errorMessage
}: BranchPickerProps) {
    const { t } = useTranslation('common');
    const { selectedBranch } = useBranch();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const errorId = `${id}-error`;

    /** Abre el diálogo y registra la disponibilidad que se muestra. */
    const handleOpenDialog = () => {
        console.log('Disponibilidad por sucursal:', statuses);
        setIsDialogOpen(true);
    };

    return (
        <div className={hasError ? `${styles.card} ${styles.cardInvalid}` : styles.card}>
            <span className={styles.label}>
                {t('branch.label')}{isRequired && ' *'}
            </span>

            <p className={selectedBranch ? styles.selectedName : `${styles.selectedName} ${styles.selectedNameEmpty}`}>
                <FaStore aria-hidden="true" />
                {selectedBranch ? selectedBranch.name : t('branch.noneSelected')}
            </p>

            {children}

            <button
                id={id}
                type="button"
                className={styles.openButton}
                aria-haspopup="dialog"
                aria-invalid={hasError}
                aria-describedby={hasError && errorMessage ? errorId : undefined}
                onClick={handleOpenDialog}
            >
                {selectedBranch ? t('branch.change') : t('branch.choose')}
            </button>

            {hasError && errorMessage && (
                <span id={errorId} className={styles.error}>
                    {errorMessage}
                </span>
            )}

            <BranchPickerDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                description={dialogDescription}
                statuses={statuses}
                isSelectable
                footnote={dialogFootnote}
            />
        </div>
    );
}
