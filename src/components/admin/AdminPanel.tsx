/**
 * @fileoverview Contenido del panel administrativo dentro de la cuenta,
 * disponible solo para quien puede ver información administrativa.
 */

import RequirePermission from '../access/RequirePermission';
import UsageDashboard from './UsageDashboard';

/**
 * Muestra las métricas de uso al administrador. A cualquier otra persona le
 * muestra un mensaje de acceso denegado.
 *
 * @return El dashboard o el mensaje de acceso denegado.
 */
export default function AdminPanel() {
    return (
        <RequirePermission permission="VIEW_ADMIN_INFORMATION">
            <UsageDashboard />
        </RequirePermission>
    );
}
