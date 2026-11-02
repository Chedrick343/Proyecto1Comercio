/**
 * @fileoverview Símbolo de la marca: un colgante de gota en una cadena fina.
 */

/** Propiedades de LogoMark. */
interface LogoMarkProps {
    /** Clase para definir el tamaño; el color se hereda del texto (currentColor). */
    className?: string;
}

/**
 * Dibuja el símbolo de la marca. Es decorativo, así que se oculta a los
 * lectores de pantalla; el nombre de la marca debe acompañarlo como texto.
 *
 * @param props Propiedades del componente.
 * @return El símbolo en SVG.
 */
export default function LogoMark({ className }: LogoMarkProps) {
    return (
        <svg
            className={className}
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d="M6 8Q32 36 58 8" strokeWidth="2" strokeDasharray="1 3.6" />
            <circle cx="32" cy="24.5" r="3" strokeWidth="2" />
            <path
                d="M32 28C38 36 43 42 43 47A11 11 0 0 1 21 47C21 42 26 36 32 28Z"
                fill="currentColor"
                fillOpacity="0.14"
                strokeWidth="2.4"
            />
            <path d="M26.5 47L32 38.5L37.5 47" strokeWidth="1.8" />
        </svg>
    );
}
