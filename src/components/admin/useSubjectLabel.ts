/**
 * @fileoverview Nombre legible de un usuario o invitado en el panel administrativo.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { AnalyticsSubject } from '../../activity/analyticsTypes';
import type { UserRole } from '../../session/userTypes';

/** Caracteres del identificador de un invitado que se muestran. */
const GUEST_ID_LENGTH = 8;

/**
 * Acorta el identificador de un invitado, que tiene el formato guest-<uuid>.
 *
 * @param guestId Identificador completo.
 * @return Los primeros caracteres del uuid.
 */
const shortenGuestId = (guestId: string): string =>
    guestId.replace(/^guest-/, '').slice(0, GUEST_ID_LENGTH);

/**
 * Da una función que nombra a un sujeto: el correo de un usuario, con su rol
 * si se conoce, o un identificador corto para un invitado.
 *
 * @return La función que obtiene el nombre de un sujeto.
 */
export function useSubjectLabel() {
    const { t } = useTranslation(['admin', 'auth']);

    return useCallback(
        (subject: AnalyticsSubject, role?: UserRole): string => {
            if (subject.type === 'guest') {
                return t('admin:usage.guest', { id: shortenGuestId(subject.id) });
            }

            return role
                ? t('admin:usage.userWithRole', { email: subject.id, role: t(`auth:roles.${role}`) })
                : subject.id;
        },
        [t]
    );
}
