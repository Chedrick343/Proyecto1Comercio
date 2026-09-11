import { useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Header from './components/header/Header';
import SearchBar from './components/search-bar/searchBar';
import Filters from './components/filters/filters';
import ProductsGrid from './components/Products/Products';
import NavBar from './components/navBar/NavBar';
import ProductDetailPage from './components/product-detail/ProductDetailPage';

import {
    DEFAULT_FILTERS,
    type Product,
    type ProductFilters
} from './utils/Products';
import { searchProducts } from './utils/algolia';


export default function App() {

    const [draftSearch, setDraftSearch] = useState('');
    const [searchText, setSearchText] = useState('');

    // Categorías + precio: se aplican de inmediato (sin botón)
    const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);

    // Catálogo completo, sin filtrar, SOLO para armar la lista de checkboxes
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const appliedFilters = useMemo<ProductFilters>(
        () => ({ ...filters, search: searchText }),
        [filters, searchText]
    );

    const handleSearch = () => {
        setSearchText(draftSearch);
    };

    // Trae el catálogo completo una sola vez, para poblar los checkboxes
    useEffect(() => {
        const controller = new AbortController();

        searchProducts(DEFAULT_FILTERS, controller.signal)
            .then(setAllProducts)
            .catch(() => {
                // Si falla, simplemente no se listan categorías dinámicas
            });

        return () => controller.abort();
    }, []);

    // Se dispara cada vez que cambian categorías, precio o texto aplicado
    useEffect(() => {
        const controller = new AbortController();

        setIsLoading(true);
        setError(null);

        searchProducts(appliedFilters, controller.signal)
            .then(setProducts)
            .catch((requestError: unknown) => {
                if (requestError instanceof DOMException && requestError.name === 'AbortError') {
                    return;
                }

                setError(requestError instanceof Error
                    ? requestError.message
                    : 'No se pudieron cargar los productos.');
                setProducts([]);
            })
            .finally(() => setIsLoading(false));

        return () => controller.abort();
    }, [appliedFilters]);

    return (

        <Routes>
            <Route path="/producto/:productId" element={<ProductDetailPage />} />
            <Route
                path="*"
                element={
                    <main className="app">

                        <div className="top-bar">
                            <Header />
                            <SearchBar
                                value={draftSearch}
                                onChange={setDraftSearch}
                                onSearch={handleSearch}
                            />
                        </div>

                        <div className="catalog-layout">

                            <Filters
                                products={allProducts}
                                filters={filters}
                                onFiltersChange={setFilters}
                            />

                            <div className="catalog-results">
                                {isLoading && <p>Cargando productos...</p>}
                                {error && <p role="alert">{error}</p>}
                                {!isLoading && !error && <ProductsGrid products={products} />}
                            </div>

                        </div>

                        <NavBar />

                    </main>
                }
            />
        </Routes>

    );
}