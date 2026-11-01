/**
 * @fileoverview Indicador numérico de la cantidad de productos en el carrito.
 */

import styles from './CartBadge.module.css';

/** Cantidad máxima mostrada; a partir de ahí se muestra "99+". */
const MAX_DISPLAYED_COUNT = 99;

/** Propiedades de CartBadge. */
interface CartBadgeProps {
    /** Cantidad de productos. */
    count: number;
    /** Usa los colores invertidos, para fondos oscuros. */
    inverted?: boolean;
    /** Clase adicional para ajustar la posición. */
    className?: string;
}

/**
 * Muestra la cantidad de productos del carrito. Es decorativo: el texto
 * accesible lo aporta el botón que lo contiene.
 *
 * @param props Propiedades del componente.
 * @return El indicador, o null si la cantidad es cero.
 */
export default function CartBadge({ count, inverted = false, className }: CartBadgeProps) {
    if (count <= 0) {
        return null;
    }

    const classNames = [styles.badge, inverted && styles.inverted, className]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classNames} aria-hidden="true">
            {count > MAX_DISPLAYED_COUNT ? `${MAX_DISPLAYED_COUNT}+` : count}
        </span>
    );
}
