/**
 * @fileoverview Panel del buscador con las categorías exploradas y las
 * búsquedas recientes del usuario.
 */

import { useId, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaHistory, FaTimes } from 'react-icons/fa';

import type { ExploredCategory } from '../../activity/userHistory';
import {
    getCatalogCategoryPath,
    getCatalogSearchPath
} from '../../catalog/catalogSearchParams';

import styles from './SearchHistoryPanel.module.css';

/** Propiedades de SearchHistoryPanel. */
interface SearchHistoryPanelProps {
    id: string;
    /** Textos buscados, del más reciente al más antiguo. */
    recentSearches: string[];
    /** Categorías exploradas, de la más reciente a la más antigua. */
    exploredCategories: ExploredCategory[];
    /** Se llama al elegir una búsqueda o una categoría. */
    onSelect: () => void;
    onRemoveSearch: (query: string) => void;
}

/**
 * Evita que el campo de búsqueda pierda el foco al hacer clic en el panel;
 * si lo perdiera, el panel se cerraría antes de procesar el clic.
 *
 * @param event Evento del mouse.
 */
const keepInputFocus = (event: MouseEvent) => event.preventDefault();

/**
 * Muestra las categorías que el usuario estuvo explorando y sus búsquedas
 * recientes, cada una con un botón para quitarla del historial.
 *
 * @param props Propiedades del componente.
 * @return El panel del historial.
 */
export default function SearchHistoryPanel({
    id,
    recentSearches,
    exploredCategories,
    onSelect,
    onRemoveSearch
}: SearchHistoryPanelProps) {
    const { t } = useTranslation('catalog');
    const exploredHeadingId = useId();
    const searchesHeadingId = useId();

    return (
        <div id={id} className={styles.panel} onMouseDown={keepInputFocus}>
            {exploredCategories.length > 0 && (
                <section aria-labelledby={exploredHeadingId}>
                    <h2 id={exploredHeadingId} className={styles.heading}>
                        {t('search.history.keepExploring')}
                    </h2>

                    <ul className={styles.categories}>
                        {exploredCategories.map(({ category, viewedCount, imageUrl }) => (
                            <li key={category}>
                                <Link
                                    to={getCatalogCategoryPath(category)}
                                    className={styles.category}
                                    onClick={onSelect}
                                >
                                    <span className={styles.categoryImage}>
                                        <img src={imageUrl} alt="" loading="lazy" />
                                    </span>
                                    <span className={styles.categoryName}>{category}</span>
                                    <span className={styles.categoryCount}>
                                        {t('search.history.viewedCount', { count: viewedCount })}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {recentSearches.length > 0 && (
                <section aria-labelledby={searchesHeadingId}>
                    <h2 id={searchesHeadingId} className={styles.heading}>
                        {t('search.history.recentSearches')}
                    </h2>

                    <ul className={styles.searches}>
                        {recentSearches.map((query) => (
                            <li key={query} className={styles.search}>
                                <Link
                                    to={getCatalogSearchPath(query)}
                                    className={styles.searchLink}
                                    onClick={onSelect}
                                >
                                    <FaHistory aria-hidden="true" className={styles.searchIcon} />
                                    {query}
                                </Link>

                                <button
                                    type="button"
                                    className={styles.removeButton}
                                    onClick={() => onRemoveSearch(query)}
                                    aria-label={t('search.history.remove', { query })}
                                    title={t('search.history.remove', { query })}
                                >
                                    <FaTimes aria-hidden="true" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
