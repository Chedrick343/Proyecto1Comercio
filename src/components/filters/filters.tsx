import { useEffect, useMemo, useState } from 'react';

import styles from './Filters.module.css';

import {
    MIN_PRICE,
    MAX_PRICE,
    PRICE_STEP,
    type Product,
    type ProductFilters
} from '../../utils/Products';


interface FiltersProps {
    products: Product[];
    filters: ProductFilters;
    onFiltersChange: (filters: ProductFilters) => void;
}


export default function Filters({
    products,
    filters,
    onFiltersChange
}: FiltersProps) {

    const [filtersOpen, setFiltersOpen] = useState(false);

    const { selectedCategories } = {
        selectedCategories: filters.categories
    };

    /* =====================
       PRECIO EN BORRADOR
       (solo se aplica al presionar el botón)
    ===================== */

    const [draftMinPrice, setDraftMinPrice] = useState(filters.minPrice);
    const [draftMaxPrice, setDraftMaxPrice] = useState(filters.maxPrice);

    // Si los filtros aplicados cambian desde fuera (ej. "Clear filters"),
    // sincronizamos el borrador para que no quede desfasado.
    useEffect(() => {
        setDraftMinPrice(filters.minPrice);
        setDraftMaxPrice(filters.maxPrice);
    }, [filters.minPrice, filters.maxPrice]);

    const priceIsDirty =
        draftMinPrice !== filters.minPrice ||
        draftMaxPrice !== filters.maxPrice;


    /* =====================
       CATEGORÍAS
    ===================== */

    const categories = useMemo(() => {
        const uniqueCategories = new Set<string>();

        products.forEach((product) => {
            product.categories.forEach((category) => {
                uniqueCategories.add(category);
            });
        });

        return Array.from(uniqueCategories).sort();
    }, [products]);

    const handleCategoryChange = (category: string) => {
        const nextCategories = selectedCategories.includes(category)
            ? selectedCategories.filter((item) => item !== category)
            : [...selectedCategories, category];

        onFiltersChange({
            ...filters,
            categories: nextCategories
        });
    };


    /* =====================
       PRECIO (borrador local)
    ===================== */

    const handleDraftMinPriceChange = (value: number) => {
        if (value <= draftMaxPrice) {
            setDraftMinPrice(value);
        }
    };

    const handleDraftMaxPriceChange = (value: number) => {
        if (value >= draftMinPrice) {
            setDraftMaxPrice(value);
        }
    };

    const handleApplyPrice = () => {
        onFiltersChange({
            ...filters,
            minPrice: draftMinPrice,
            maxPrice: draftMaxPrice
        });
    };


    /* =====================
       LIMPIAR FILTROS
    ===================== */

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
            >
                Filters
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
                    <h2 className={styles.filterTitle}>Categories</h2>

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
                    <h2 className={styles.filterTitle}>Price Range</h2>

                    <div className={styles.priceValues}>
                        <div className={styles.priceBox}>
                            <span>Minimum</span>
                            <strong>₡{draftMinPrice.toLocaleString('es-CR')}</strong>
                        </div>

                        <div className={styles.priceBox}>
                            <span>Maximum</span>
                            <strong>₡{draftMaxPrice.toLocaleString('es-CR')}</strong>
                        </div>
                    </div>

                    <div className={styles.sliderContainer}>
                        <label className={styles.sliderLabel}>Minimum Price</label>
                        <input
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
                        <label className={styles.sliderLabel}>Maximum Price</label>
                        <input
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
                        <span>₡0</span>
                        <span>₡3,000,000</span>
                    </div>

                    <button
                        type="button"
                        className={styles.applyPriceButton}
                        onClick={handleApplyPrice}
                        disabled={!priceIsDirty}
                    >
                        Apply price
                    </button>
                </div>

                <button
                    type="button"
                    className={styles.clearButton}
                    onClick={handleClearFilters}
                >
                    Clear filters
                </button>

            </div>

        </section>

    );
}