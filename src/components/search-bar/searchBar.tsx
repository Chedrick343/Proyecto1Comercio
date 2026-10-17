import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSearchBox } from 'react-instantsearch';
import { isSearchFocusRequested } from './searchFocus';
import styles from './SearchBar.module.css';

const SEARCH_DEBOUNCE_MS = 250;

export default function SearchBar() {
    const { t } = useTranslation('catalog');
    const { query, refine } = useSearchBox();
    const [inputValue, setInputValue] = useState(query);
    const inputRef = useRef<HTMLInputElement>(null);
    const location = useLocation();
    const shouldFocusSearch = isSearchFocusRequested(location.state);

    useEffect(() => {
        if (shouldFocusSearch) {
            inputRef.current?.focus();
        }
    }, [shouldFocusSearch, location.key]);

    useEffect(() => {
        if (inputValue === query) {
            return;
        }

        const timeoutId = window.setTimeout(
            () => refine(inputValue),
            SEARCH_DEBOUNCE_MS
        );

        return () => window.clearTimeout(timeoutId);
    }, [inputValue, query, refine]);

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
                        onClick={() => {
                            setInputValue('');
                            refine('');
                        }}
                    >
                        <FaTimes aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
}