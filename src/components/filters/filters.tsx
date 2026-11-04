/**
 * @fileoverview Panel de filtros del catálogo por categoría y rango de precio.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaChevronDown, FaSlidersH } from 'react-icons/fa';

import styles from './filters.module.css';
import { formatCurrency } from '../../utils/formatCurrency';

import {
    MIN_PRICE,
    MAX_PRICE,
    PRICE_STEP,
    type Product,
    type ProductFilters
} from '../../utils/Products';


/**
 * Calcula la posición de un precio dentro del rango permitido.
 *
 * @param price Precio a ubicar.
 * @return El porcentaje del recorrido entre MIN_PRICE y MAX_PRICE.
 */
const getPricePercent = (price: number) =>
    ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

/** Propiedades de Filters. */
interface FiltersProps {
    /** Productos de los que se obtienen las categorías disponibles. */
    products: Product[];
    /** Filtros aplicados actualmente. */
    filters: ProductFilters;
    /** Se llama con los nuevos filtros cuando el usuario los cambia. */
    onFiltersChange: (filters: ProductFilters) => void;
}


/**
 * Muestra un panel desplegable con las categorías y el rango de precio. Las
 * categorías se aplican al marcarlas; el precio, que se elige con un control
 * de dos extremos, al presionar el botón.
 *
 * @param props Propiedades del componente.
 * @return El panel de filtros.
 */
export default function Filters({
    products,
    filters,
    onFiltersChange
}: FiltersProps) {

    const { t } = useTranslation('catalog');
    const [filtersOpen, setFiltersOpen] = useState(false);

    const selectedCategories = filters.categories;

    // El rango de precio es un borrador que solo se aplica al presionar el botón.
    const [draftMinPrice, setDraftMinPrice] = useState(filters.minPrice);
    const [draftMaxPrice, setDraftMaxPrice] = useState(filters.maxPrice);

    // Si los filtros aplicados cambian desde fuera (por ejemplo, al limpiarlos),
    // sincronizamos el borrador para que no quede desfasado.
    useEffect(() => {
        setDraftMinPrice(filters.minPrice);
        setDraftMaxPrice(filters.maxPrice);
    }, [filters.minPrice, filters.maxPrice]);

    const priceIsDirty =
        draftMinPrice !== filters.minPrice ||
        draftMaxPrice !== filters.maxPrice;

    const hasActiveFilters =
        selectedCategories.length > 0 ||
        filters.minPrice !== MIN_PRICE ||
        filters.maxPrice !== MAX_PRICE;


    /** Categorías presentes en los productos, en orden alfabético, con su cantidad de productos. */
    const categories = useMemo(() => {
        const productCounts = new Map<string, number>();

        products.forEach((product) => {
            product.categories.forEach((category) => {
                productCounts.set(category, (productCounts.get(category) ?? 0) + 1);
            });
        });

        return Array.from(productCounts, ([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products]);

    const minPercent = getPricePercent(draftMinPrice);
    const maxPercent = getPricePercent(draftMaxPrice);

    /**
     * Marca o desmarca una categoría y aplica el cambio.
     *
     * @param category Categoría seleccionada.
     */
    const handleCategoryChange = (category: string) => {
        const nextCategories = selectedCategories.includes(category)
            ? selectedCategories.filter((item) => item !== category)
            : [...selectedCategories, category];

        onFiltersChange({
            ...filters,
            categories: nextCategories
        });
    };


    /**
     * Actualiza el precio mínimo del borrador sin dejar que supere al máximo.
     *
     * @param value Nuevo precio mínimo.
     */
    const handleDraftMinPriceChange = (value: number) => {
        setDraftMinPrice(Math.min(value, draftMaxPrice));
    };

    /**
     * Actualiza el precio máximo del borrador sin dejar que sea menor que el mínimo.
     *
     * @param value Nuevo precio máximo.
     */
    const handleDraftMaxPriceChange = (value: number) => {
        setDraftMaxPrice(Math.max(value, draftMinPrice));
    };

    /** Aplica el rango de precio del borrador. */
    const handleApplyPrice = () => {
        onFiltersChange({
            ...filters,
            minPrice: draftMinPrice,
            maxPrice: draftMaxPrice
        });
    };


    /** Quita todas las categorías y restablece el rango de precio completo. */
    const handleClearFilters = () => {
        onFiltersChange({
            ...filters,
            categories: [],
            minPrice: MIN_PRICE,
            maxPrice: MAX_PRICE
        });

        setDraftMinPrice(MIN_PRICE);
        setDraftMaxPrice(MAX_PRICE);
    };


    return (

        <section className={styles.filters}>

            <button
                type="button"
                className={`${styles.filtersButton} ${filtersOpen ? styles.filtersButtonOpen : ''}`}
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
            >
                <FaSlidersH className={styles.buttonIcon} aria-hidden="true" />
                <span className={styles.buttonLabel}>{t('filters.toggle')}</span>
                {selectedCategories.length > 0 && (
                    <span className={styles.countBadge}>{selectedCategories.length}</span>
                )}
                <FaChevronDown className={styles.chevron} aria-hidden="true" />
            </button>

            <div
                className={`${styles.filtersPanel} ${
                    filtersOpen ? styles.filtersPanelOpen : ''
                }`}
            >

                <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>
                        <FaSlidersH className={styles.panelTitleIcon} aria-hidden="true" />
                        {t('filters.toggle')}
                    </h2>

                    <button
                        type="button"
                        className={styles.clearButton}
                        onClick={handleClearFilters}
                        disabled={!hasActiveFilters}
                    >
                        {t('filters.clear')}
                    </button>
                </div>

                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>{t('filters.categories')}</h3>

                    <div className={styles.categoriesList}>
                        {categories.map(({ name, count }) => (
                            <label key={name} className={styles.categoryOption}>
                                <input
                                    type="checkbox"
                                    className={styles.checkboxInput}
                                    checked={selectedCategories.includes(name)}
                                    onChange={() => handleCategoryChange(name)}
                                />
                                <span className={styles.checkbox} aria-hidden="true">
                                    <FaCheck />
                                </span>
                                <span className={styles.categoryName}>{name}</span>
                                <span className={styles.categoryCount}>{count}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>{t('filters.priceRange')}</h3>

                    <div className={styles.priceValues}>
                        <div className={styles.priceBox}>
                            <span>{t('filters.minimum')}</span>
                            <strong>{formatCurrency(draftMinPrice)}</strong>
                        </div>

                        <div className={styles.priceBox}>
                            <span>{t('filters.maximum')}</span>
                            <strong>{formatCurrency(draftMaxPrice)}</strong>
                        </div>
                    </div>

                    <div
                        className={styles.rangeSlider}
                        style={{
                            '--range-start': `${minPercent}%`,
                            '--range-end': `${maxPercent}%`
                        } as CSSProperties}
                    >
                        <div className={styles.rangeTrack} aria-hidden="true" />

                        <label htmlFor="filter-min-price" className={styles.visuallyHidden}>
                            {t('filters.minimumPrice')}
                        </label>
                        <input
                            id="filter-min-price"
                            type="range"
                            min={MIN_PRICE}
                            max={MAX_PRICE}
                            step={PRICE_STEP}
                            value={draftMinPrice}
                            aria-valuetext={formatCurrency(draftMinPrice)}
                            onChange={(event) =>
                                handleDraftMinPriceChange(Number(event.target.value))
                            }
                            className={`${styles.priceSlider} ${
                                minPercent > 50 ? styles.priceSliderOnTop : ''
                            }`}
                        />

                        <label htmlFor="filter-max-price" className={styles.visuallyHidden}>
                            {t('filters.maximumPrice')}
                        </label>
                        <input
                            id="filter-max-price"
                            type="range"
                            min={MIN_PRICE}
                            max={MAX_PRICE}
                            step={PRICE_STEP}
                            value={draftMaxPrice}
                            aria-valuetext={formatCurrency(draftMaxPrice)}
                            onChange={(event) =>
                                handleDraftMaxPriceChange(Number(event.target.value))
                            }
                            className={styles.priceSlider}
                        />
                    </div>

                    <div className={styles.priceLimits}>
                        <span>{formatCurrency(MIN_PRICE)}</span>
                        <span>{formatCurrency(MAX_PRICE)}</span>
                    </div>

                    <button
                        type="button"
                        className={styles.applyPriceButton}
                        onClick={handleApplyPrice}
                        disabled={!priceIsDirty}
                    >
                        {t('filters.applyPrice')}
                    </button>
                </div>

            </div>

        </section>

    );
}
