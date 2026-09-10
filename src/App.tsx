import { useEffect, useState } from 'react';
import './App.css';
import Header from './components/header/Header';
import SearchBar from './components/search-bar/searchBar';
import Filters from './components/filters/filters';
import ProductsGrid from './components/Products/Products';
import NavBar from './components/navBar/NavBar';


import {
    DEFAULT_FILTERS,
    type Product,
    type ProductFilters
} from './utils/Products';
import { searchProducts } from './utils/algolia';


export default function App() {


    const [draftSearch, setDraftSearch] = useState('');
    const [draftFilters, setDraftFilters] = useState<ProductFilters>(DEFAULT_FILTERS);


    const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const handleSearch = () => {

        setAppliedFilters({
            ...draftFilters,
            search: draftSearch
        });

    };


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

        <main className="app">

            <Header />

            <SearchBar
                value={draftSearch}
                onChange={setDraftSearch}
                onSearch={handleSearch}
            />

            <Filters
                filters={draftFilters}
                onFiltersChange={setDraftFilters}
            />

            {isLoading && <p>Cargando productos...</p>}
            {error && <p role="alert">{error}</p>}
            {!isLoading && !error && <ProductsGrid products={products} />}

            <NavBar />

        </main>

    );
}