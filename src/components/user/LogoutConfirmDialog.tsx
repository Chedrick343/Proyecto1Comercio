/**
 * @fileoverview Confirmación antes de cerrar la sesión.
 */

import { useTranslation } from 'react-i18next';
import { FaPowerOff } from 'react-icons/fa';

import ActionDialog from '../dialog/ActionDialog';

import dialogStyles from '../dialog/ActionDialog.module.css';

/** Propiedades de LogoutConfirmDialog. */
interface LogoutConfirmDialogProps {
    /** Nombre del usuario cuya sesión se cerrará. */
    userName: string;
    /** Indica si el diálogo está abierto. */
    isOpen: boolean;
    /** Se llama cuando el diálogo se cierra sin confirmar. */
    onClose: () => void;
    /** Se llama cuando el usuario confirma que quiere cerrar sesión. */
    onConfirm: () => void;
}

/**
 * Pide confirmar el cierre de sesión. Cancelar es la acción segura, así que
 * va primero.
 *
 * @param props Propiedades del componente.
 * @return El diálogo de confirmación.
 */
export default function LogoutConfirmDialog({
    userName,
    isOpen,
    onClose,
    onConfirm
}: LogoutConfirmDialogProps) {
    const { t } = useTranslation('account');

    return (
        <ActionDialog
            isOpen={isOpen}
            onClose={onClose}
            icon={FaPowerOff}
            tone="danger"
            eyebrow={t('logoutDialog.eyebrow')}
            title={t('logoutDialog.title')}
            description={t('logoutDialog.description', { name: userName })}
            actions={
                <>
                    <button type="button" className={dialogStyles.secondaryAction} onClick={onClose}>
                        {t('logoutDialog.cancel')}
                    </button>
                    <button type="button" className={dialogStyles.dangerAction} onClick={onConfirm}>
                        {t('logoutDialog.confirm')}
                    </button>
                </>
            }
        />
    );
}
