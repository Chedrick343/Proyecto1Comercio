/**
 * @fileoverview Selector personalizado de usuario o invitado para filtrar las
 * métricas, con búsqueda y opciones agrupadas.
 */

import {
    useEffect,
    useId,
    useRef,
    useState,
    type FocusEvent,
    type KeyboardEvent
} from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaChevronDown, FaSearch } from 'react-icons/fa';

import type { AnalyticsSubject } from '../../activity/analyticsTypes';
import SubjectAvatar from './SubjectAvatar';

import styles from './SubjectSelect.module.css';

/**
 * Cantidad máxima de opciones visibles a la vez. Con más sujetos, la
 * búsqueda es la forma de llegar a los demás.
 */
const MAX_VISIBLE_OPTIONS = 50;

/** Opción del selector. */
export interface SubjectOption {
    value: string;
    label: string;
    /** Usuario o invitado de la opción; no existe en la opción "todos". */
    subject?: AnalyticsSubject;
    eventCount: number;
}

/** Grupo de opciones de la lista. */
type OptionGroupId = 'users' | 'guests';

/** Opciones visibles de un grupo, con su posición dentro de la lista completa. */
interface VisibleGroup {
    id: OptionGroupId;
    options: { option: SubjectOption; index: number }[];
}

/** Propiedades de SubjectSelect. */
interface SubjectSelectProps {
    /** Etiqueta visible del selector. */
    label: string;
    options: SubjectOption[];
    /** Valor de la opción elegida. */
    value: string;
    onChange: (value: string) => void;
}

/**
 * Normaliza un texto para compararlo sin distinguir mayúsculas ni tildes.
 *
 * @param text Texto a normalizar.
 * @return El texto en minúsculas y sin tildes.
 */
const normalizeText = (text: string): string =>
    text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

/**
 * Filtra las opciones por texto y las ordena para mostrarlas: primero la
 * opción general (solo sin búsqueda), luego los usuarios y luego los
 * invitados, sin pasar de MAX_VISIBLE_OPTIONS.
 *
 * @param options Todas las opciones.
 * @param query Texto buscado.
 * @return Las opciones visibles en orden y la cantidad total de coincidencias.
 */
function getVisibleOptions(options: SubjectOption[], query: string) {
    const normalizedQuery = normalizeText(query.trim());
    const matches = (option: SubjectOption) =>
        !normalizedQuery || normalizeText(option.label).includes(normalizedQuery);

    const generalOptions = normalizedQuery ? [] : options.filter((option) => !option.subject);
    const userOptions = options.filter((option) => option.subject?.type === 'user' && matches(option));
    const guestOptions = options.filter((option) => option.subject?.type === 'guest' && matches(option));
    const matchCount = userOptions.length + guestOptions.length;

    const visible = [...generalOptions, ...userOptions, ...guestOptions].slice(
        0,
        generalOptions.length + MAX_VISIBLE_OPTIONS
    );

    return { visible, matchCount };
}

/**
 * Muestra un selector con avatar y cantidad de eventos por opción. Al
 * abrirlo, el foco pasa a un campo de búsqueda que filtra la lista; las
 * opciones se agrupan en usuarios e invitados. Se maneja con las flechas,
 * Enter y Escape, y la opción activa se anuncia con aria-activedescendant.
 *
 * @param props Propiedades del componente.
 * @return El selector con su lista desplegable.
 */
export default function SubjectSelect({ label, options, value, onChange }: SubjectSelectProps) {
    const { t } = useTranslation('admin');
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const labelId = useId();
    const listboxId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const selectedOption = options.find((option) => option.value === value) ?? options[0];
    const { visible, matchCount } = getVisibleOptions(options, query);
    const generalOptions = visible.filter((option) => !option.subject);
    const hiddenCount = matchCount - (visible.length - generalOptions.length);

    const groups: VisibleGroup[] = (['users', 'guests'] as const)
        .map((id) => ({
            id,
            options: visible
                .map((option, index) => ({ option, index }))
                .filter(({ option }) => option.subject?.type === (id === 'users' ? 'user' : 'guest'))
        }))
        .filter((group) => group.options.length > 0);

    /**
     * Obtiene el id del elemento de una opción visible.
     *
     * @param index Posición de la opción en la lista visible.
     * @return El id, único en la página.
     */
    const getOptionId = (index: number) => `${listboxId}-option-${index}`;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        searchRef.current?.focus();

        /**
         * Cierra la lista al tocar fuera del selector.
         *
         * @param event Evento del puntero.
         */
        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document
                .getElementById(`${listboxId}-option-${activeIndex}`)
                ?.scrollIntoView({ block: 'nearest' });
        }
    }, [isOpen, activeIndex, listboxId]);

    /** Abre la lista sin búsqueda, con la opción elegida activa. */
    const open = () => {
        setQuery('');
        setActiveIndex(Math.max(0, getVisibleOptions(options, '').visible.indexOf(selectedOption)));
        setIsOpen(true);
    };

    /** Cierra la lista y devuelve el foco al botón del selector. */
    const close = () => {
        setIsOpen(false);
        triggerRef.current?.focus();
    };

    /**
     * Elige una opción y cierra la lista.
     *
     * @param option Opción elegida.
     */
    const choose = (option: SubjectOption) => {
        onChange(option.value);
        close();
    };

    /**
     * Actualiza la búsqueda y activa la primera coincidencia.
     *
     * @param nextQuery Texto escrito.
     */
    const handleQueryChange = (nextQuery: string) => {
        setQuery(nextQuery);
        setActiveIndex(0);
    };

    /**
     * Abre la lista con las flechas desde el botón.
     *
     * @param event Evento del teclado.
     */
    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            open();
        }
    };

    /**
     * Mueve la opción activa, elige con Enter y cierra con Escape.
     *
     * @param event Evento del teclado.
     */
    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        const lastIndex = visible.length - 1;
        const actions: Record<string, () => void> = {
            ArrowDown: () => setActiveIndex(Math.min(activeIndex + 1, lastIndex)),
            ArrowUp: () => setActiveIndex(Math.max(activeIndex - 1, 0)),
            Enter: () => visible[activeIndex] && choose(visible[activeIndex]),
            Escape: close
        };
        const action = actions[event.key];

        if (action) {
            event.preventDefault();
            action();
        }
    };

    /**
     * Cierra la lista cuando el foco sale del selector.
     *
     * @param event Evento de pérdida de foco.
     */
    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        if (!rootRef.current?.contains(event.relatedTarget)) {
            setIsOpen(false);
        }
    };

    /**
     * Muestra una opción de la lista.
     *
     * @param option Opción a mostrar.
     * @param index Posición de la opción en la lista visible.
     * @return El elemento de la opción.
     */
    const renderOption = (option: SubjectOption, index: number) => {
        const isSelected = option.value === selectedOption?.value;
        const className = [
            styles.option,
            index === activeIndex && styles.optionActive,
            isSelected && styles.optionSelected
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <li
                key={option.value}
                id={getOptionId(index)}
                role="option"
                aria-selected={isSelected}
                className={className}
                onClick={() => choose(option)}
                onMouseMove={() => setActiveIndex(index)}
            >
                <SubjectAvatar subject={option.subject} />
                <span className={styles.optionText}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionCount}>
                        {t('usage.eventCount', { count: option.eventCount })}
                    </span>
                </span>
                {isSelected && <FaCheck aria-hidden="true" className={styles.check} />}
            </li>
        );
    };

    return (
        <div ref={rootRef} className={styles.select} onBlur={handleBlur}>
            <span id={labelId} className={styles.label}>{label}</span>

            <button
                ref={triggerRef}
                type="button"
                className={isOpen ? `${styles.trigger} ${styles.triggerOpen}` : styles.trigger}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={`${labelId} ${listboxId}-value`}
                onClick={() => (isOpen ? close() : open())}
                onKeyDown={handleTriggerKeyDown}
            >
                <SubjectAvatar subject={selectedOption?.subject} />
                <span id={`${listboxId}-value`} className={styles.triggerText}>
                    {selectedOption?.label}
                </span>
                <FaChevronDown aria-hidden="true" className={styles.chevron} />
            </button>

            {isOpen && (
                <div className={styles.popup}>
                    <div className={styles.search}>
                        <FaSearch aria-hidden="true" className={styles.searchIcon} />
                        <input
                            ref={searchRef}
                            type="text"
                            role="combobox"
                            className={styles.searchInput}
                            placeholder={t('usage.subjectSearch.placeholder')}
                            aria-label={t('usage.subjectSearch.label')}
                            aria-expanded="true"
                            aria-controls={listboxId}
                            aria-autocomplete="list"
                            aria-activedescendant={visible.length > 0 ? getOptionId(activeIndex) : undefined}
                            autoComplete="off"
                            value={query}
                            onChange={(event) => handleQueryChange(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>

                    <ul
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={labelId}
                        className={styles.listbox}
                        // Keeps focus on the search field so the list does not close before the click.
                        onMouseDown={(event) => event.preventDefault()}
                    >
                        {generalOptions.map((option) => renderOption(option, visible.indexOf(option)))}

                        {groups.map((group) => (
                            <li key={group.id} role="presentation">
                                <span id={`${listboxId}-${group.id}`} className={styles.groupLabel}>
                                    {t(`usage.subjectSearch.groups.${group.id}`)}
                                </span>
                                <ul role="group" aria-labelledby={`${listboxId}-${group.id}`} className={styles.group}>
                                    {group.options.map(({ option, index }) => renderOption(option, index))}
                                </ul>
                            </li>
                        ))}
                    </ul>

                    {visible.length === 0 && (
                        <p className={styles.message}>{t('usage.subjectSearch.noResults', { query })}</p>
                    )}

                    {hiddenCount > 0 && (
                        <p className={styles.message}>
                            {t('usage.subjectSearch.moreResults', {
                                shown: matchCount - hiddenCount,
                                count: matchCount
                            })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
