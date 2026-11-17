/**
 * @fileoverview Filtros de las consultas del panel que se pliegan en móvil.
 */

import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaSlidersH } from 'react-icons/fa';

import styles from './AdminTable.module.css';

/** Propiedades de CollapsibleFilters. */
interface CollapsibleFiltersProps {
    /** Cantidad de filtros con un valor distinto de "todos". */
    activeCount: number;
    /** Los selectores de los filtros. */
    children: ReactNode;
}

/**
 * Muestra los filtros. En escritorio siempre están visibles; en móvil se
 * esconden detrás de un botón "Filtros" que indica cuántos hay activos, para
 * que los resultados no queden debajo de varios selectores.
 *
 * @param props Propiedades del componente.
 * @return El botón para mostrar los filtros y los filtros.
 */
export default function CollapsibleFilters({ activeCount, children }: CollapsibleFiltersProps) {
    const { t } = useTranslation('admin');
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className={isOpen ? `${styles.filtersToggle} ${styles.filtersToggleOpen}` : styles.filtersToggle}
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <FaSlidersH aria-hidden="true" />
                {activeCount > 0 ? t('filtersToggleActive', { count: activeCount }) : t('filtersToggle')}
                <FaChevronDown aria-hidden="true" className={styles.filtersToggleChevron} />
            </button>

            <div className={isOpen ? `${styles.filterOptions} ${styles.filterOptionsOpen}` : styles.filterOptions}>
                {children}
            </div>
        </>
    );
}
