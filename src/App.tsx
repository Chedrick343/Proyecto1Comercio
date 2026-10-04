import { useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
    Configure,
    InstantSearch,
    useHits,
    useInstantSearch
} from 'react-instantsearch';

import './App.css';

import Header, { CartButton } from './components/header/Header';
import SearchBar from './components/search-bar/searchBar';
import Filters from './components/filters/filters';
import ProductsGrid from './components/Products/Products';
import NavBar from './components/navBar/NavBar';
import ProductDetailPage from './components/product-detail/ProductDetailPage';
import CarritoSection from './components/carrito/carritoSection';

import {
    DEFAULT_FILTERS,
    type ProductFilters,
    filterProducts
} from './utils/Products';

import {
    indexName,
    normalizeAlgoliaProduct,
    searchClient
} from './utils/algolia';


function ProductCatalog() {
    const { items } = useHits();
    const { status, error } = useInstantSearch();

    const [filters, setFilters] =
        useState<ProductFilters>(DEFAULT_FILTERS);

    const allProducts = useMemo(
        () => items.map(normalizeAlgoliaProduct),
        [items]
    );

    const products = useMemo(
        () => filterProducts(allProducts, filters),
        [allProducts, filters]
    );

    const isLoading =
        status === 'loading' ||
        status === 'stalled';

    const hasVisibleResults =
        allProducts.length > 0;

    return (
        <main className="app">

            <div className="top-bar">
                <Header showCart={false} />
                <div className="search-tools">
                    <SearchBar />
                    <CartButton inSearchTools />
                </div>
            </div>

            <div className="catalog-layout">

                <Filters
                    products={allProducts}
                    filters={filters}
                    onFiltersChange={setFilters}
                />

                <div
                    className="catalog-results"
                    aria-busy={isLoading}
                >
                    {isLoading && !hasVisibleResults && (
                        <p>
                            Cargando productos...
                        </p>
                    )}

                    {status === 'error' && (
                        <p role="alert">
                            {error instanceof Error
                                ? error.message
                                : 'No se pudieron cargar los productos.'}
                        </p>
                    )}

                    {status !== 'error' &&
                        (!isLoading || hasVisibleResults) && (
                            <ProductsGrid
                                products={products}
                            />
                        )}
                </div>

            </div>

            <NavBar />

        </main>
    );
}


export default function App() {

    if (!searchClient || !indexName) {
        return (
            <main className="app">
                <p role="alert">
                    Faltan VITE_ALGOLIA_APPLICATION_ID,
                    VITE_ALGOLIA_SEARCH_API_KEY o
                    VITE_ALGOLIA_INDEX_NAME.
                </p>
            </main>
        );
    }

    return (
        <Routes>

            {/*CATÁLOGO */}

            <Route
                path="/"
                element={
                    <InstantSearch
                        searchClient={searchClient}
                        indexName={indexName}
                    >
                        <Configure hitsPerPage={1000} />

                        <ProductCatalog />
                    </InstantSearch>
                }
            />


            {/*DETALLE DEL PRODUCTO */}

            <Route
                path="/producto/:productId"
                element={
                    <ProductDetailPage />
                }
            />


            {/*CARRITO*/}

            <Route
                path="/carrito"
                element={
                    <main className="app">
                        <div className="top-bar">
                            <Header />
                        </div>

                        <CarritoSection />

                        <NavBar />
                    </main>
                }
            />


            {/*RUTA NO ENCONTRADA*/}

            <Route
                path="*"
                element={
                    <InstantSearch
                        searchClient={searchClient}
                        indexName={indexName}
                    >
                        <Configure hitsPerPage={1000} />

                        <ProductCatalog />
                    </InstantSearch>
                }
            />

        </Routes>
    );
}