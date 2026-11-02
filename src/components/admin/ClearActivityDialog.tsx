/**
 * @fileoverview Confirmación antes de borrar la actividad registrada.
 */

import { useTranslation } from 'react-i18next';
import { FaTrashAlt } from 'react-icons/fa';

import ActionDialog from '../dialog/ActionDialog';

import dialogStyles from '../dialog/ActionDialog.module.css';

/** Propiedades de ClearActivityDialog. */
interface ClearActivityDialogProps {
    /** Cantidad de eventos que se borrarán. */
    eventCount: number;
    /** Indica si el diálogo está abierto. */
    isOpen: boolean;
    /** Se llama cuando el diálogo se cierra sin confirmar. */
    onClose: () => void;
    /** Se llama cuando el administrador confirma el borrado. */
    onConfirm: () => void;
}

/**
 * Pide confirmar el borrado de todos los eventos. Cancelar es la acción
 * segura, así que va primero.
 *
 * @param props Propiedades del componente.
 * @return El diálogo de confirmación.
 */
export default function ClearActivityDialog({
    eventCount,
    isOpen,
    onClose,
    onConfirm
}: ClearActivityDialogProps) {
    const { t } = useTranslation('admin');

    return (
        <ActionDialog
            isOpen={isOpen}
            onClose={onClose}
            icon={FaTrashAlt}
            tone="danger"
            eyebrow={t('usage.clearDialog.eyebrow')}
            title={t('usage.clearDialog.title')}
            description={t('usage.clearDialog.description', { count: eventCount })}
            actions={
                <>
                    <button type="button" className={dialogStyles.secondaryAction} onClick={onClose}>
                        {t('usage.clearDialog.cancel')}
                    </button>
                    <button type="button" className={dialogStyles.dangerAction} onClick={onConfirm}>
                        {t('usage.clearDialog.confirm')}
                    </button>
                </>
            }
        />
    );
}
