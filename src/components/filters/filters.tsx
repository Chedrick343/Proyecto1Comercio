import { useState } from 'react';
import styles from './Filters.module.css';
import {
    MIN_PRICE,
    MAX_PRICE,
    PRICE_STEP,
    type ProductFilters
} from '../../utils/Products';


const categories = [
    'Tecnología',
    'Computadoras',
    'Laptops',
    'Periféricos',
    'Mouse',
    'Teclados',
    'Monitores',
    'Audio',
    'Audífonos',
    'Telefonía',
    'Smartphones',
    'Tablets',
    'Dispositivos móviles',
    'Componentes',
    'Almacenamiento',
    'Videojuegos',
    'Consolas',
    'Gaming',
    'Tarjetas gráficas',
    'Memoria RAM',
    'Redes',
    'Routers',
    'Wearables',
    'Smartwatches',
    'Hogar inteligente',
    'Asistentes de voz',
    'Entretenimiento',
    'Streaming',
    'Accesorios',
    'Cargadores',
    'Controles',
    'Oficina',
    'Impresoras',
    'Memorias'
];


interface FiltersProps {
    filters: ProductFilters;
    onFiltersChange: (filters: ProductFilters) => void;
}


export default function Filters({ filters, onFiltersChange }: FiltersProps) {

    // Lo único que sigue siendo estado propio del componente:
    // si el panel está abierto o cerrado
    const [filtersOpen, setFiltersOpen] = useState(false);


    const { selectedCategories, minPrice, maxPrice } = {
        selectedCategories: filters.categories,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice
    };


    const handleCategoryChange = (category: string) => {

        const nextCategories = selectedCategories.includes(category)
            ? selectedCategories.filter((item) => item !== category)
            : [...selectedCategories, category];

        onFiltersChange({
            ...filters,
            categories: nextCategories
        });
    };


    const handleMinPriceChange = (value: number) => {

        // Evita que el mínimo sea mayor que el máximo
        if (value <= maxPrice) {
            onFiltersChange({ ...filters, minPrice: value });
        }

    };


    const handleMaxPriceChange = (value: number) => {

        // Evita que el máximo sea menor que el mínimo
        if (value >= minPrice) {
            onFiltersChange({ ...filters, maxPrice: value });
        }

    };


    const handleClearFilters = () => {

        onFiltersChange({
            ...filters,
            categories: [],
            minPrice: MIN_PRICE,
            maxPrice: MAX_PRICE
        });

    };


    return (

        <section className={styles.filters}>

            {/* BOTÓN PRINCIPAL */}

            <button
                className={styles.filtersButton}
                onClick={() => setFiltersOpen(!filtersOpen)}
            >
                Filters
                {selectedCategories.length > 0 && ` (${selectedCategories.length})`}
                <span>
                    {filtersOpen ? '▲' : '▼'}
                </span>
            </button>


            {/* PANEL DE FILTROS */}
            {/* Siempre está en el DOM: en móvil el CSS lo oculta hasta que
                se abre, y en escritorio el CSS lo muestra siempre (barra lateral) */}

            <div
                className={`${styles.filtersPanel} ${
                    filtersOpen ? styles.filtersPanelOpen : ''
                }`}
            >

                    <div className={styles.filterSection}>

                        <h2 className={styles.filterTitle}>
                            Categories
                        </h2>


                        <div className={styles.categoriesList}>

                            {categories.map((category) => (

                                <label
                                    key={category}
                                    className={styles.categoryOption}
                                >

                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(category)}
                                        onChange={() =>
                                            handleCategoryChange(category)
                                        }
                                    />

                                    <span>
                                        {category}
                                    </span>

                                </label>

                            ))}

                        </div>

                    </div>



                    <div className={styles.filterSection}>

                        <h2 className={styles.filterTitle}>
                            Price Range
                        </h2>


                        {/* PRECIOS ACTUALES */}

                        <div className={styles.priceValues}>

                            <div className={styles.priceBox}>

                                <span>Minimum</span>

                                <strong>
                                    ₡{minPrice.toLocaleString('es-CR')}
                                </strong>

                            </div>


                            <div className={styles.priceBox}>

                                <span>Maximum</span>

                                <strong>
                                    ₡{maxPrice.toLocaleString('es-CR')}
                                </strong>

                            </div>

                        </div>

                        <div className={styles.sliderContainer}>

                            <label className={styles.sliderLabel}>
                                Minimum Price
                            </label>

                            <input
                                type="range"
                                min={MIN_PRICE}
                                max={MAX_PRICE}
                                step={PRICE_STEP}
                                value={minPrice}
                                onChange={(event) =>
                                    handleMinPriceChange(
                                        Number(event.target.value)
                                    )
                                }
                                className={styles.priceSlider}
                            />

                        </div>

                        <div className={styles.sliderContainer}>

                            <label className={styles.sliderLabel}>
                                Maximum Price
                            </label>

                            <input
                                type="range"
                                min={MIN_PRICE}
                                max={MAX_PRICE}
                                step={PRICE_STEP}
                                value={maxPrice}
                                onChange={(event) =>
                                    handleMaxPriceChange(
                                        Number(event.target.value)
                                    )
                                }
                                className={styles.priceSlider}
                            />

                        </div>

                        <div className={styles.priceLimits}>

                            <span>
                                ₡0
                            </span>

                            <span>
                                ₡1,000,000
                            </span>

                        </div>

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