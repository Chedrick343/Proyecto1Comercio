/**
 * @fileoverview Panel de filtros del catálogo por categoría y rango de precio.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './filters.module.css';
import { formatCurrency } from '../../utils/formatCurrency';

import {
    MIN_PRICE,
    MAX_PRICE,
    PRICE_STEP,
    type Product,
    type ProductFilters
} from '../../utils/Products';


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
 * categorías se aplican al marcarlas; el precio, al presionar el botón.
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


    /** Categorías presentes en los productos, sin repetir y en orden alfabético. */
    const categories = useMemo(() => {
        const uniqueCategories = new Set<string>();

        products.forEach((product) => {
            product.categories.forEach((category) => {
                uniqueCategories.add(category);
            });
        });

        return Array.from(uniqueCategories).sort();
    }, [products]);

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
     * Actualiza el precio mínimo del borrador si no supera al máximo.
     *
     * @param value Nuevo precio mínimo.
     */
    const handleDraftMinPriceChange = (value: number) => {
        if (value <= draftMaxPrice) {
            setDraftMinPrice(value);
        }
    };

    /**
     * Actualiza el precio máximo del borrador si no es menor que el mínimo.
     *
     * @param value Nuevo precio máximo.
     */
    const handleDraftMaxPriceChange = (value: number) => {
        if (value >= draftMinPrice) {
            setDraftMaxPrice(value);
        }
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
                className={styles.filtersButton}
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
            >
                {t('filters.toggle')}
                {selectedCategories.length > 0 && ` (${selectedCategories.length})`}
                <span>{filtersOpen ? '▲' : '▼'}</span>
            </button>

            <div
                className={`${styles.filtersPanel} ${
                    filtersOpen ? styles.filtersPanelOpen : ''
                }`}
            >

                {/* CATEGORÍAS (sin cambios, aplican al instante) */}

                <div className={styles.filterSection}>
                    <h2 className={styles.filterTitle}>{t('filters.categories')}</h2>

                    <div className={styles.categoriesList}>
                        {categories.map((category) => (
                            <label key={category} className={styles.categoryOption}>
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category)}
                                    onChange={() => handleCategoryChange(category)}
                                />
                                <span>{category}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* RANGO DE PRECIO (borrador + botón Apply) */}

                <div className={styles.filterSection}>
                    <h2 className={styles.filterTitle}>{t('filters.priceRange')}</h2>

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

                    <div className={styles.sliderContainer}>
                        <label htmlFor="filter-min-price" className={styles.sliderLabel}>
                            {t('filters.minimumPrice')}
                        </label>
                        <input
                            id="filter-min-price"
                            type="range"
                            min={MIN_PRICE}
                            max={MAX_PRICE}
                            step={PRICE_STEP}
                            value={draftMinPrice}
                            onChange={(event) =>
                                handleDraftMinPriceChange(Number(event.target.value))
                            }
                            className={styles.priceSlider}
                        />
                    </div>

                    <div className={styles.sliderContainer}>
                        <label htmlFor="filter-max-price" className={styles.sliderLabel}>
                            {t('filters.maximumPrice')}
                        </label>
                        <input
                            id="filter-max-price"
                            type="range"
                            min={MIN_PRICE}
                            max={MAX_PRICE}
                            step={PRICE_STEP}
                            value={draftMaxPrice}
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

                <button
                    type="button"
                    className={styles.clearButton}
                    onClick={handleClearFilters}
                >
                    {t('filters.clear')}
                </button>

            </div>

        </section>

    );
}