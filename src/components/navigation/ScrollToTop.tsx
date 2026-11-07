/**
 * @fileoverview Restablece el desplazamiento de la página al cambiar de ruta.
 */

import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Desplaza la ventana al inicio en cada navegación nueva. Al volver atrás
 * o adelante (POP) respeta la posición que restaura el navegador.
 *
 * @return Nada; el componente solo tiene efectos.
 */
export default function ScrollToTop() {
    const { pathname } = useLocation();
    const navigationType = useNavigationType();

    useEffect(() => {
        if (navigationType !== 'POP') {
            window.scrollTo({ top: 0, left: 0 });
        }
    }, [pathname, navigationType]);

    return null;
}
