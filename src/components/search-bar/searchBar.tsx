import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { isSearchFocusRequested } from './searchFocus';
import { readCatalogQuery, withCatalogQuery } from '../../catalog/catalogSearchParams';
import styles from './SearchBar.module.css';

const SEARCH_DEBOUNCE_MS = 250;

export default function SearchBar() {
    const { t } = useTranslation('catalog');
    const [searchParams, setSearchParams] = useSearchParams();
    const query = readCatalogQuery(searchParams);

    const [inputValue, setInputValue] = useState(query);
    const [lastSyncedQuery, setLastSyncedQuery] = useState(query);
    const inputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const shouldFocusSearch = isSearchFocusRequested(location.state);

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

    useEffect(() => {
        if (inputValue.trim() === query) {
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
    }, [inputValue, query, setSearchParams]);

    const clearSearch = () => {
        setInputValue('');
        setSearchParams(
            (currentParams) => withCatalogQuery(currentParams, ''),
            { replace: true }
        );
    };

    return (
        <div className={styles.searchBar}>
            <div className={styles.searchGroup}>
                <input
                    ref={inputRef}
                    type="search"
                    placeholder={t('search.placeholder')}
                    className={styles.searchInput}
                    aria-label={t('search.label')}
                    autoComplete="off"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
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
        </div>
    );
}
