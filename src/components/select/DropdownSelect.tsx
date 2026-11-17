/**
 * @fileoverview Selector desplegable con estilo propio de la tienda. Se usa
 * para elegir usuarios en las métricas y para los filtros de las tablas del
 * panel administrativo. Puede tener búsqueda, opciones agrupadas e íconos.
 */

import {
    useEffect,
    useId,
    useRef,
    useState,
    type FocusEvent,
    type KeyboardEvent,
    type ReactNode
} from 'react';
import { FaCheck, FaChevronDown, FaSearch } from 'react-icons/fa';

import { normalizeText } from '../../utils/normalizeText';

import styles from './DropdownSelect.module.css';

/** Opción del selector. */
export interface DropdownOption {
    value: string;
    label: string;
    /** Texto secundario bajo la etiqueta, por ejemplo una cantidad. */
    detail?: string;
    /** Grupo de la opción; las opciones sin grupo se muestran primero. */
    group?: string;
    /** Ícono o imagen a la izquierda de la etiqueta. */
    icon?: ReactNode;
}

/** Configuración de la búsqueda dentro del selector. */
export interface DropdownSearch {
    placeholder: string;
    /** Etiqueta accesible del campo de búsqueda. */
    label: string;
    /** Mensaje cuando nada coincide con lo buscado. */
    getNoResultsText: (query: string) => string;
    /** Mensaje cuando hay más coincidencias de las que se muestran. */
    getMoreResultsText?: (shown: number, total: number) => string;
    /** Cantidad máxima de opciones con grupo visibles a la vez. */
    maxVisibleOptions?: number;
}

/** Propiedades de DropdownSelect. */
interface DropdownSelectProps {
    /** Etiqueta visible del selector. */
    label: string;
    options: DropdownOption[];
    /** Valor de la opción elegida. */
    value: string;
    onChange: (value: string) => void;
    /** "inline" pone la etiqueta al lado; "stacked", encima y a todo el ancho. */
    layout?: 'inline' | 'stacked';
    /** Si se indica, la lista tiene un campo para buscar opciones. */
    search?: DropdownSearch;
    /** Nombre visible de cada grupo, en el orden en que se muestran. */
    groupLabels?: Record<string, string>;
}

/** Opciones visibles de un grupo, con su posición dentro de la lista completa. */
interface VisibleGroup {
    id: string;
    options: { option: DropdownOption; index: number }[];
}

/**
 * Filtra las opciones por texto y las ordena: primero las que no tienen
 * grupo (solo sin búsqueda) y luego las de cada grupo, en el orden de
 * groupLabels, sin pasar del máximo visible.
 *
 * @param options Todas las opciones.
 * @param query Texto buscado.
 * @param groupOrder Grupos en el orden en que se muestran.
 * @param maxVisibleOptions Máximo de opciones con grupo visibles.
 * @return Las opciones visibles en orden y la cantidad de coincidencias con grupo.
 */
function getVisibleOptions(
    options: DropdownOption[],
    query: string,
    groupOrder: string[],
    maxVisibleOptions: number
) {
    const normalizedQuery = normalizeText(query);
    const matches = (option: DropdownOption) =>
        !normalizedQuery || normalizeText(option.label).includes(normalizedQuery);
    const ungroupedOptions = options.filter(
        (option) => !option.group && (!normalizedQuery || matches(option))
    );
    const groupedOptions = groupOrder.flatMap((groupId) =>
        options.filter((option) => option.group === groupId && matches(option))
    );
    const visible = [...ungroupedOptions, ...groupedOptions.slice(0, maxVisibleOptions)];

    return { visible, matchCount: groupedOptions.length };
}

/**
 * Muestra un botón con la opción elegida que abre una lista estilizada. Se
 * maneja con las flechas, Enter y Escape, y la opción activa se anuncia con
 * aria-activedescendant. Si tiene búsqueda, al abrirlo el foco pasa a un
 * campo que filtra la lista.
 *
 * @param props Propiedades del componente.
 * @return El selector con su lista desplegable.
 */
export default function DropdownSelect({
    label,
    options,
    value,
    onChange,
    layout = 'inline',
    search,
    groupLabels = {}
}: DropdownSelectProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const labelId = useId();
    const listboxId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const groupOrder = Object.keys(groupLabels);
    const maxVisibleOptions = search?.maxVisibleOptions ?? options.length;
    const selectedOption = options.find((option) => option.value === value) ?? options[0];
    const { visible, matchCount } = getVisibleOptions(options, query, groupOrder, maxVisibleOptions);
    const ungroupedVisible = visible.filter((option) => !option.group);
    const hiddenCount = matchCount - (visible.length - ungroupedVisible.length);
    const groups: VisibleGroup[] = groupOrder
        .map((id) => ({
            id,
            options: visible
                .map((option, index) => ({ option, index }))
                .filter(({ option }) => option.group === id)
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
            document.getElementById(`${listboxId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
        }
    }, [isOpen, activeIndex, listboxId]);

    /** Abre la lista sin búsqueda, con la opción elegida activa. */
    const open = () => {
        setQuery('');
        const allVisible = getVisibleOptions(options, '', groupOrder, maxVisibleOptions).visible;
        setActiveIndex(Math.max(0, allVisible.indexOf(selectedOption)));
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
    const choose = (option: DropdownOption) => {
        onChange(option.value);
        close();
    };

    /**
     * Mueve la opción activa, elige con Enter y cierra con Escape.
     *
     * @param event Evento del teclado.
     */
    const handleListKeyDown = (event: KeyboardEvent<HTMLElement>) => {
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
     * Abre la lista con las flechas desde el botón. Sin búsqueda, el foco se
     * queda en el botón, así que también maneja la lista abierta.
     *
     * @param event Evento del teclado.
     */
    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (isOpen && !search) {
            handleListKeyDown(event);
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            open();
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
    const renderOption = (option: DropdownOption, index: number) => {
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
                {option.icon}
                <span className={styles.optionText}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.detail && <span className={styles.optionDetail}>{option.detail}</span>}
                </span>
                {isSelected && <FaCheck aria-hidden="true" className={styles.check} />}
            </li>
        );
    };

    const triggerClassName = [
        styles.trigger,
        isOpen && styles.triggerOpen,
        !selectedOption?.icon && styles.triggerNoIcon
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            ref={rootRef}
            className={layout === 'stacked' ? `${styles.select} ${styles.selectStacked}` : styles.select}
            onBlur={handleBlur}
        >
            <span id={labelId} className={styles.label}>{label}</span>

            <button
                ref={triggerRef}
                type="button"
                className={triggerClassName}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-labelledby={`${labelId} ${listboxId}-value`}
                aria-activedescendant={isOpen && !search ? getOptionId(activeIndex) : undefined}
                onClick={() => (isOpen ? close() : open())}
                onKeyDown={handleTriggerKeyDown}
            >
                {selectedOption?.icon}
                <span id={`${listboxId}-value`} className={styles.triggerText}>
                    {selectedOption?.label}
                </span>
                <FaChevronDown aria-hidden="true" className={styles.chevron} />
            </button>

            {isOpen && (
                <div className={styles.popup}>
                    {search && (
                        <div className={styles.search}>
                            <FaSearch aria-hidden="true" className={styles.searchIcon} />
                            <input
                                ref={searchRef}
                                type="text"
                                role="combobox"
                                className={styles.searchInput}
                                placeholder={search.placeholder}
                                aria-label={search.label}
                                aria-expanded="true"
                                aria-controls={listboxId}
                                aria-autocomplete="list"
                                aria-activedescendant={visible.length > 0 ? getOptionId(activeIndex) : undefined}
                                autoComplete="off"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={handleListKeyDown}
                            />
                        </div>
                    )}

                    <ul
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={labelId}
                        className={styles.listbox}
                        // Evita que el clic quite el foco y cierre la lista antes de elegir.
                        onMouseDown={(event) => event.preventDefault()}
                    >
                        {ungroupedVisible.map((option) => renderOption(option, visible.indexOf(option)))}
                        {groups.map((group) => (
                            <li key={group.id} role="presentation">
                                <span id={`${listboxId}-${group.id}`} className={styles.groupLabel}>
                                    {groupLabels[group.id]}
                                </span>
                                <ul role="group" aria-labelledby={`${listboxId}-${group.id}`} className={styles.group}>
                                    {group.options.map(({ option, index }) => renderOption(option, index))}
                                </ul>
                            </li>
                        ))}
                    </ul>

                    {search && visible.length === 0 && (
                        <p className={styles.message}>{search.getNoResultsText(query)}</p>
                    )}
                    {search?.getMoreResultsText && hiddenCount > 0 && (
                        <p className={styles.message}>
                            {search.getMoreResultsText(matchCount - hiddenCount, matchCount)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
