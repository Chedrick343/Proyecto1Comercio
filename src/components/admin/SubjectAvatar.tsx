/**
 * @fileoverview Avatar de un usuario o invitado en el panel administrativo.
 */

import { FaUserSecret, FaUsers } from 'react-icons/fa';

import type { AnalyticsSubject } from '../../activity/analyticsTypes';

import styles from './SubjectAvatar.module.css';

/** Propiedades de SubjectAvatar. */
interface SubjectAvatarProps {
    /** Usuario o invitado; si no se indica, representa a todos. */
    subject?: AnalyticsSubject;
}

/**
 * Muestra la inicial del correo de un usuario, un ícono de invitado o, sin
 * sujeto, un ícono de grupo.
 *
 * @param props Propiedades del componente.
 * @return El avatar, oculto para lectores de pantalla.
 */
export default function SubjectAvatar({ subject }: SubjectAvatarProps) {
    if (!subject) {
        return (
            <span className={`${styles.avatar} ${styles.groupAvatar}`} aria-hidden="true">
                <FaUsers />
            </span>
        );
    }

    if (subject.type === 'guest') {
        return (
            <span className={`${styles.avatar} ${styles.guestAvatar}`} aria-hidden="true">
                <FaUserSecret />
            </span>
        );
    }

    return (
        <span className={styles.avatar} aria-hidden="true">
            {subject.id.charAt(0).toUpperCase()}
        </span>
    );
}
