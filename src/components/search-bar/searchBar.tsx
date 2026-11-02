/**
 * @fileoverview Barra de búsqueda del catálogo.
 */

import {
    useEffect,
    useId,
    useRef,
    useState,
    type FocusEvent,
    type FormEvent,
    type KeyboardEvent
} from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useUserHistory } from '../../activity/useUserHistory';
import { isSearchFocusRequested } from './searchFocus';
import SearchHistoryPanel from './SearchHistoryPanel';
import {
    getCatalogSearchPath,
    readCatalogQuery,
    withCatalogQuery
} from '../../catalog/catalogSearchParams';
import { useViewTransitionNavigate } from '../navigation/useViewTransitionNavigate';
import styles from './SearchBar.module.css';

/** Espera tras la última tecla antes de buscar en modo "live". */
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Comportamiento de la búsqueda. "live" actualiza el catálogo mientras se
 * escribe; "submit" solo busca con Enter o el botón y lleva al catálogo
 * (se usa fuera del catálogo, por ejemplo en la página de producto).
 */
export type SearchBarMode = 'live' | 'submit';

/** Propiedades de SearchBar. */
interface SearchBarProps {
    /** Comportamiento de la búsqueda; por defecto, "live". */
    mode?: SearchBarMode;
}

/**
 * Muestra la barra de búsqueda. El texto buscado se guarda en la URL y se
 * enfoca automáticamente cuando la navegación lo solicita. Al enfocarla
 * vacía, despliega el historial de búsqueda del usuario.
 *
 * @param props Propiedades del componente.
 * @return El formulario de búsqueda.
 */
export default function SearchBar({ mode = 'live' }: SearchBarProps) {
    const { t } = useTranslation('catalog');
    const [searchParams, setSearchParams] = useSearchParams();
    const navigateWithTransition = useViewTransitionNavigate();
    const query = readCatalogQuery(searchParams);
    const isLiveSearch = mode === 'live';

    const [inputValue, setInputValue] = useState(query);
    const [lastSyncedQuery, setLastSyncedQuery] = useState(query);
    const inputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const shouldFocusSearch = isSearchFocusRequested(location.state);

    const { recentSearches, exploredCategories, removeRecentSearch } = useUserHistory();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const historyPanelId = useId();
    const hasHistory = recentSearches.length > 0 || exploredCategories.length > 0;
    // Like other stores, the history only shows while the field is empty; typing hides it.
    const showHistory = isHistoryOpen && hasHistory && inputValue.trim() === '';

    // Keeps the input in sync when the URL changes from outside (e.g. back button).
    if (query !== lastSyncedQuery) {
        setLastSyncedQuery(query);
        setInputValue(query);
    }

    useEffect(() => {
        if (shouldFocusSearch) {
            inputRef.current?.focus();
        }
    }, [shouldFocusSearch, location.key]);

    /**
     * Reemplaza la búsqueda en la URL sin agregar una entrada al historial.
     *
     * @param nextQuery Texto a buscar.
     */
    const updateCatalogQuery = (nextQuery: string) => {
        setSearchParams(
            (currentParams) => withCatalogQuery(currentParams, nextQuery),
            { replace: true }
        );
    };

    useEffect(() => {
        if (!isLiveSearch || inputValue.trim() === query) {
            return;
        }

        const timeoutId = window.setTimeout(
            () => setSearchParams(
                (currentParams) => withCatalogQuery(currentParams, inputValue),
                { replace: true }
            ),
            SEARCH_DEBOUNCE_MS
        );

        return () => window.clearTimeout(timeoutId);
    }, [isLiveSearch, inputValue, query, setSearchParams]);

    /**
     * Ejecuta la búsqueda: en modo "live" actualiza la URL; en modo "submit"
     * navega al catálogo con la búsqueda.
     *
     * @param event Evento de envío del formulario.
     */
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsHistoryOpen(false);
        // Closes the on-screen keyboard on mobile after searching.
        inputRef.current?.blur();

        if (isLiveSearch) {
            updateCatalogQuery(inputValue);
            return;
        }

        navigateWithTransition(getCatalogSearchPath(inputValue));
    };

    /** Borra el texto buscado y devuelve el foco al campo. */
    const clearSearch = () => {
        setInputValue('');
        inputRef.current?.focus();

        if (isLiveSearch) {
            updateCatalogQuery('');
        }
    };

    /** Cierra el historial tras elegir una búsqueda o categoría. */
    const handleHistorySelect = () => {
        setIsHistoryOpen(false);
        inputRef.current?.blur();
    };

    /**
     * Cierra el historial cuando el foco sale del formulario.
     *
     * @param event Evento de pérdida de foco.
     */
    const handleFormBlur = (event: FocusEvent<HTMLFormElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsHistoryOpen(false);
        }
    };

    /**
     * Cierra el historial con Escape, sin borrar lo escrito.
     *
     * @param event Evento del teclado.
     */
    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape' && showHistory) {
            event.preventDefault();
            setIsHistoryOpen(false);
        }
    };

    return (
        <form
            className={styles.searchBar}
            role="search"
            onSubmit={handleSubmit}
            onBlur={handleFormBlur}
        >
            <div
                className={
                    showHistory ? `${styles.searchGroup} ${styles.searchGroupOpen}` : styles.searchGroup
                }
            >
                <div className={styles.searchField}>
                    <input
                        ref={inputRef}
                        type="search"
                        enterKeyHint="search"
                        placeholder={t('search.placeholder')}
                        className={styles.searchInput}
                        aria-label={t('search.label')}
                        autoComplete="off"
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        onFocus={() => setIsHistoryOpen(true)}
                        onClick={() => setIsHistoryOpen(true)}
                        onKeyDown={handleInputKeyDown}
                        aria-controls={showHistory ? historyPanelId : undefined}
                    />
                    {inputValue && (
                        <button
                            type="button"
                            className={styles.clearButton}
                            aria-label={t('search.clear')}
                            title={t('search.clear')}
                            onClick={clearSearch}
                        >
                            <FaTimes aria-hidden="true" />
                        </button>
                    )}
                </div>

                <button type="submit" className={styles.submitButton}>
                    <FaSearch aria-hidden="true" />
                    <span className={styles.submitLabel}>{t('search.submit')}</span>
                </button>

                {showHistory && (
                    <SearchHistoryPanel
                        id={historyPanelId}
                        recentSearches={recentSearches}
                        exploredCategories={exploredCategories}
                        onSelect={handleHistorySelect}
                        onRemoveSearch={removeRecentSearch}
                    />
                )}
            </div>
        </form>
    );
}
