/**
 * @fileoverview Campo de búsqueda con el estilo del buscador del selector
 * desplegable, para los filtros de las tablas.
 */

import { useId } from 'react';
import { FaSearch } from 'react-icons/fa';

import styles from './SearchField.module.css';

/** Propiedades de SearchField. */
interface SearchFieldProps {
    /** Etiqueta visible del campo. */
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
}

/**
 * Muestra un campo de búsqueda con su etiqueta y una lupa.
 *
 * @param props Propiedades del componente.
 * @return El campo de búsqueda.
 */
export default function SearchField({ label, value, placeholder, onChange }: SearchFieldProps) {
    const inputId = useId();

    return (
        <div className={styles.field}>
            <label htmlFor={inputId} className={styles.label}>{label}</label>
            <div className={styles.inputWrapper}>
                <FaSearch aria-hidden="true" className={styles.icon} />
                <input
                    id={inputId}
                    type="search"
                    className={styles.input}
                    value={value}
                    placeholder={placeholder}
                    autoComplete="off"
                    onChange={(event) => onChange(event.target.value)}
                />
            </div>
        </div>
    );
}
