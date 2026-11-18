/**
 * @fileoverview Cuadrícula paginada de productos del catálogo.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaThLarge, FaList, FaLock } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './ProductsGrid.module.css';
import { useSession } from '../../context/SessionContext';
import { hasPermission } from '../../session/permissions';
import { ADMIN_PATH } from '../admin/adminRoutes';
import type { Product } from '../../utils/Products';
import ProductCard, { type ProductCardLayout } from './ProductCard';
import Pagination from '../pagination/Pagination';
import {
    CATALOG_PAGE_PARAM,
    formatCatalogPageParam,
    readCatalogPage,
    withCatalogPage
} from '../../catalog/catalogSearchParams';


/** Propiedades de ProductsGrid. */
interface ProductsGridProps {
    /** Productos ya filtrados que se deben mostrar. */
    products: Product[];
}



/** Cantidad de productos por página. */
const PRODUCTS_PER_PAGE = 12;

/**
 * Muestra los productos en cuadrícula o lista, con paginación. La página
 * actual se guarda en la URL y se corrige si está fuera de rango.
 *
 * @param props Propiedades del componente.
 * @return La sección de productos.
 */
export default function ProductsGrid({ products }: ProductsGridProps) {

    const { t } = useTranslation('catalog');
    const { currentUser } = useSession();
    const canBuy = hasPermission(currentUser, 'ADD_TO_CART');
    const allProducts = products;

    const [searchParams, setSearchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState<ProductCardLayout>('grid');

    const sectionRef = useRef<HTMLElement>(null);


    const totalPages = Math.max(
        1,
        Math.ceil(allProducts.length / PRODUCTS_PER_PAGE)
    );


    const currentPage = Math.min(readCatalogPage(searchParams), totalPages);
    const pageParamInUrl = searchParams.get(CATALOG_PAGE_PARAM);
    const canonicalPageParam = formatCatalogPageParam(currentPage);

    // Fixes out-of-range or malformed pages in the URL (e.g. ?pagina=999).
    useEffect(() => {
        if (allProducts.length > 0 && pageParamInUrl !== canonicalPageParam) {
            setSearchParams(
                (currentParams) => withCatalogPage(currentParams, currentPage),
                { replace: true }
            );
        }
    }, [allProducts.length, pageParamInUrl, canonicalPageParam, currentPage, setSearchParams]);


    const visibleProducts = useMemo(() => {
        const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
        return allProducts.slice(start, start + PRODUCTS_PER_PAGE);
    }, [allProducts, currentPage]);


    /**
     * Cambia de página y desplaza la vista al inicio de la sección.
     *
     * @param page Página destino; se ignora si está fuera de rango.
     */
    const goToPage = (page: number) => {

        if (page < 1 || page > totalPages) {
            return;
        }

        setSearchParams((currentParams) => withCatalogPage(currentParams, page));

        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };


    if (allProducts.length === 0) {
        return (
            <section className={styles.products}>
                <p className={styles.emptyState}>
                    {t('grid.empty')}
                </p>
            </section>
        );
    }


    return (

        <section className={styles.products} ref={sectionRef}>

            <header className={styles.productsHeader}>
                <h2 className={styles.productsTitle}>{t('grid.title')}</h2>

                <div className={styles.headerRight}>
                    <span className={styles.productsCount}>
                        {t('grid.resultCount', { count: allProducts.length })}
                    </span>

                    <div className={styles.viewToggle} role="group" aria-label={t('grid.viewMode')}>
                        <button
                            type="button"
                            className={`${styles.viewButton} ${
                                viewMode === 'grid' ? styles.viewButtonActive : ''
                            }`}
                            onClick={() => setViewMode('grid')}
                            aria-pressed={viewMode === 'grid'}
                        >
                            <FaThLarge aria-hidden="true" />
                            <span className={styles.srOnly}>{t('grid.viewAsGrid')}</span>
                        </button>

                        <button
                            type="button"
                            className={`${styles.viewButton} ${
                                viewMode === 'list' ? styles.viewButtonActive : ''
                            }`}
                            onClick={() => setViewMode('list')}
                            aria-pressed={viewMode === 'list'}
                        >
                            <FaList aria-hidden="true" />
                            <span className={styles.srOnly}>{t('grid.viewAsList')}</span>
                        </button>
                    </div>
                </div>
            </header>

            {!canBuy && (
                <p className={styles.adminNotice}>
                    <FaLock aria-hidden="true" />
                    <span>
                        {t('grid.adminNotice')}{' '}
                        <Link to={ADMIN_PATH} className={styles.adminNoticeLink}>{t('grid.adminNoticeLink')}</Link>
                    </span>
                </p>
            )}


            <div className={styles.scrollArea}>
                <div className={viewMode === 'grid' ? styles.grid : styles.list}>
                    {visibleProducts.map((product) => (
                        <ProductCard
                            key={product.objectID}
                            product={product}
                            layout={viewMode}
                        />
                    ))}
                </div>
            </div>


            {/* =====================
                PAGINACIÓN
            ===================== */}

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                label={t('pagination.label')}
            />

        </section>

    );
}