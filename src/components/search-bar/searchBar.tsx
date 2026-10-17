import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { useSearchBox } from 'react-instantsearch';
import { isSearchFocusRequested } from './searchFocus';
import styles from './SearchBar.module.css';

const SEARCH_DEBOUNCE_MS = 250;

export default function SearchBar() {
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
                    placeholder="Are you looking for something specific?"
                    className={styles.searchInput}
                    aria-label="Buscar productos"
                    autoComplete="off"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                />
                {inputValue && (
                    <button
                        type="button"
                        className={styles.clearButton}
                        aria-label="Limpiar búsqueda"
                        title="Limpiar búsqueda"
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