import { useEffect, useMemo } from 'react';
import { Route, Routes, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Configure,
    InstantSearch,
    useHits,
    useInstantSearch
} from 'react-instantsearch';

import './App.css';

import Header from './components/header/Header';
import SearchBar from './components/search-bar/searchBar';
import Filters from './components/filters/filters';
import ProductsGrid from './components/Products/Products';
import NavBar from './components/navBar/NavBar';
import ProductDetailPage from './components/product-detail/ProductDetailPage';
import CarritoSection from './components/carrito/carritoSection';
import CheckoutEntryPage from './components/checkout/CheckoutEntryPage';
import OrderConfirmationPage from './components/order/OrderConfirmationPage';
import AccountPage from './components/user/AccountPage';
import ErrorState from './components/error/ErrorState';
import NotFoundPage from './components/error/NotFoundPage';
import errorStateStyles from './components/error/ErrorState.module.css';

import {
    type ProductFilters,
    filterProducts
} from './utils/Products';

import {
    indexName,
    normalizeAlgoliaProduct,
    searchClient
} from './utils/algolia';
import {
    readCatalogFilters,
    readCatalogQuery,
    withCatalogFilters
} from './catalog/catalogSearchParams';

// Filtering and pagination happen on the client, so the whole index is requested.
const CATALOG_HITS_PER_PAGE = 1000;


function ProductCatalog() {
    const { t } = useTranslation(['catalog', 'errors', 'common']);
    const { items } = useHits();
    const { status, error, refresh } = useInstantSearch();
    const [searchParams, setSearchParams] = useSearchParams();
    const query = readCatalogQuery(searchParams);

    useEffect(() => {
        if (error) {
            console.error('Error al cargar el catálogo:', error);
        }
    }, [error]);

    const filters = useMemo(() => readCatalogFilters(searchParams), [searchParams]);

    const handleFiltersChange = (nextFilters: ProductFilters) => {
        setSearchParams(
            (currentParams) => withCatalogFilters(currentParams, nextFilters),
            { replace: true }
        );
    };

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
            <Configure hitsPerPage={CATALOG_HITS_PER_PAGE} query={query} />

            <div className="top-bar">
                <Header>
                    <div className="search-tools">
                        <SearchBar />
                    </div>
                </Header>
            </div>

            <div className="catalog-layout">

                <Filters
                    products={allProducts}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />

                <div
                    className="catalog-results"
                    aria-busy={isLoading}
                >
                    {isLoading && !hasVisibleResults && (
                        <p>
                            {t('catalog:loading')}
                        </p>
                    )}

                    {status === 'error' && (
                        <ErrorState
                            title={t('errors:catalogLoad.title')}
                            description={t('errors:catalogLoad.description')}
                            actions={
                                <button
                                    type="button"
                                    className={errorStateStyles.primaryAction}
                                    onClick={refresh}
                                >
                                    {t('common:actions.retry')}
                                </button>
                            }
                        />
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
    const { t } = useTranslation('errors');

    if (!searchClient || !indexName) {
        console.error(
            'Faltan VITE_ALGOLIA_APPLICATION_ID, VITE_ALGOLIA_SEARCH_API_KEY o VITE_ALGOLIA_INDEX_NAME.'
        );

        return (
            <main className={errorStateStyles.fullPage}>
                <ErrorState
                    title={t('storeUnavailable.title')}
                    description={t('storeUnavailable.description')}
                />
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

            {/*CUENTA*/}

            <Route
                path="/cuenta"
                element={<AccountPage view="menu" />}
            />

            <Route
                path="/cuenta/pedidos"
                element={<AccountPage view="orders" />}
            />

            <Route
                path="/checkout"
                element={<CheckoutEntryPage />}
            />

            <Route
                path="/orden/:orderNumber"
                element={<OrderConfirmationPage />}
            />


            {/*RUTA NO ENCONTRADA*/}

            <Route
                path="*"
                element={<NotFoundPage />}
            />

        </Routes>
    );
}