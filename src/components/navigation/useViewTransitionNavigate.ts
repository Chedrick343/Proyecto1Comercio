/**
 * @fileoverview Navegación con transiciones animadas entre páginas.
 */

import { flushSync } from 'react-dom';
import { useNavigate, type To } from 'react-router-dom';

/**
 * Indica si el usuario pidió reducir las animaciones.
 *
 * @return Verdadero si el sistema prefiere movimiento reducido.
 */
const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Crea una función de navegación que anima el cambio de página con la
 * View Transitions API. Si el navegador no la soporta o el usuario prefiere
 * movimiento reducido, navega sin animación.
 *
 * @return Una función que recibe el destino de la navegación.
 */
export function useViewTransitionNavigate() {
    const navigate = useNavigate();

    return (to: To) => {
        if (!document.startViewTransition || prefersReducedMotion()) {
            navigate(to);
            return;
        }

        // The DOM must be updated inside the callback so the browser can snapshot the new page.
        document.startViewTransition(() => {
            flushSync(() => navigate(to));
        });
    };
}
