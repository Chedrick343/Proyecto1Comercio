/**
 * @fileoverview Contenido del panel administrativo dentro de la cuenta,
 * disponible solo para el rol ADMIN.
 */

import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaLock, FaUserShield } from 'react-icons/fa';

import { useSession } from '../../context/SessionContext';
import { isAdmin } from '../../session/userTypes';
import ErrorState from '../error/ErrorState';
import { createLoginRedirectState, LOGIN_PATH } from '../login/loginRedirect';
import UsageDashboard from './UsageDashboard';

import errorStyles from '../error/ErrorState.module.css';

/**
 * Explica por qué no se puede ver el panel: a un invitado lo invita a iniciar
 * sesión y a un cliente le indica que no tiene permisos.
 *
 * @param props Propiedades del componente.
 * @param props.isGuest Indica si quien intenta entrar no ha iniciado sesión.
 * @return El mensaje de acceso denegado.
 */
function AdminAccessDenied({ isGuest }: { isGuest: boolean }) {
    const { t } = useTranslation('admin');
    const location = useLocation();

    const catalogLink = (
        <Link
            to="/"
            className={isGuest ? errorStyles.secondaryAction : errorStyles.primaryAction}
        >
            {t('access.goToCatalog')}
        </Link>
    );

    if (isGuest) {
        return (
            <ErrorState
                icon={FaUserShield}
                title={t('access.signInTitle')}
                description={t('access.signInDescription')}
                actions={
                    <>
                        <Link
                            to={LOGIN_PATH}
                            state={createLoginRedirectState(location)}
                            className={errorStyles.primaryAction}
                        >
                            {t('access.signIn')}
                        </Link>
                        {catalogLink}
                    </>
                }
            />
        );
    }

    return (
        <ErrorState
            icon={FaLock}
            title={t('access.deniedTitle')}
            description={t('access.deniedDescription')}
            actions={catalogLink}
        />
    );
}

/**
 * Muestra las métricas de uso al administrador. A cualquier otra persona le
 * muestra un mensaje de acceso denegado.
 *
 * @return El dashboard o el mensaje de acceso denegado.
 */
export default function AdminPanel() {
    const { currentUser } = useSession();

    return isAdmin(currentUser)
        ? <UsageDashboard />
        : <AdminAccessDenied isGuest={!currentUser} />;
}
