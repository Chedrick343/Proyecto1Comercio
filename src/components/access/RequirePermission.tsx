/**
 * @fileoverview Protege una página o sección para que solo la vea quien tiene
 * el permiso necesario. A los demás les explica por qué no pueden entrar.
 */

import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaLock, FaUserShield } from 'react-icons/fa';

import { useSession } from '../../context/SessionContext';
import { getAccessLevel, hasPermission, type Permission } from '../../session/permissions';
import { ADMIN_PATH } from '../admin/adminRoutes';
import ErrorState from '../error/ErrorState';
import Header from '../header/Header';
import { createLoginRedirectState, LOGIN_PATH } from '../login/loginRedirect';
import NavBar from '../navBar/NavBar';

import errorStyles from '../error/ErrorState.module.css';

/**
 * Explica por qué no se puede ver el contenido: a un invitado lo invita a
 * iniciar sesión y a un usuario sin permiso le indica a dónde puede ir.
 *
 * @param props Propiedades del componente.
 * @param props.permission Permiso que le falta al usuario.
 * @return El mensaje de acceso denegado.
 */
function AccessDenied({ permission }: { permission: Permission }) {
    const { t } = useTranslation('common');
    const { currentUser } = useSession();
    const location = useLocation();

    useEffect(() => {
        console.log(
            `Acceso denegado: el nivel ${getAccessLevel(currentUser)} no tiene el permiso ${permission} (${location.pathname}).`
        );
    }, [currentUser, permission, location.pathname]);

    if (!currentUser) {
        return (
            <ErrorState
                icon={FaUserShield}
                title={t('access.signInTitle')}
                description={t(`access.signInReasons.${permission}`)}
                actions={
                    <>
                        <Link
                            to={LOGIN_PATH}
                            state={createLoginRedirectState(location)}
                            className={errorStyles.primaryAction}
                        >
                            {t('access.signIn')}
                        </Link>
                        <Link to="/" className={errorStyles.secondaryAction}>
                            {t('access.goToCatalog')}
                        </Link>
                    </>
                }
            />
        );
    }

    const canOpenAdminPanel = hasPermission(currentUser, 'VIEW_ADMIN_INFORMATION');

    return (
        <ErrorState
            icon={FaLock}
            title={t('access.deniedTitle')}
            description={t(`access.deniedReasons.${permission}`)}
            actions={
                canOpenAdminPanel ? (
                    <Link to={ADMIN_PATH} className={errorStyles.primaryAction}>
                        {t('access.goToAdminPanel')}
                    </Link>
                ) : (
                    <Link to="/" className={errorStyles.primaryAction}>
                        {t('access.goToCatalog')}
                    </Link>
                )
            }
        />
    );
}

/** Propiedades de RequirePermission. */
interface RequirePermissionProps {
    /** Permiso necesario para ver el contenido. */
    permission: Permission;
    /**
     * Indica si el contenido es una página completa. En ese caso, el mensaje
     * de acceso denegado se muestra con el encabezado y la barra de navegación.
     */
    isPage?: boolean;
    children: ReactNode;
}

/**
 * Muestra su contenido solo si quien usa la tienda tiene el permiso indicado.
 *
 * @param props Propiedades del componente.
 * @return El contenido protegido o el mensaje de acceso denegado.
 */
export default function RequirePermission({
    permission,
    isPage = false,
    children
}: RequirePermissionProps) {
    const { currentUser } = useSession();

    if (hasPermission(currentUser, permission)) {
        return <>{children}</>;
    }

    if (!isPage) {
        return <AccessDenied permission={permission} />;
    }

    return (
        <main className="app">
            <div className="top-bar">
                <Header />
            </div>

            <AccessDenied permission={permission} />

            <NavBar />
        </main>
    );
}
