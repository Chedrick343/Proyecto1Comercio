import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaThLarge, FaList } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './ProductsGrid.module.css';
import type { Product } from '../../utils/Products';
import ProductCard, { type ProductCardLayout } from './ProductCard';
import {
    CATALOG_PAGE_PARAM,
    formatCatalogPageParam,
    readCatalogPage,
    withCatalogPage
} from '../../catalog/catalogSearchParams';


interface ProductsGridProps {
    products: Product[];
}



const PRODUCTS_PER_PAGE = 12;

// Cuántas páginas mostrar a cada lado de la página actual
const SIBLING_COUNT = 1;

const ELLIPSIS = 'ellipsis' as const;

type PageItem = number | typeof ELLIPSIS;


/* =====================
   UTILIDADES
===================== */


const getPageNumbers = (
    currentPage: number,
    totalPages: number
): PageItem[] => {

    // Si son pocas páginas, las mostramos todas sin puntos suspensivos
    const totalVisibleSlots = SIBLING_COUNT * 2 + 5;

    if (totalPages <= totalVisibleSlots) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1);
    const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages);

    const showLeftEllipsis = leftSibling > 2;
    const showRightEllipsis = rightSibling < totalPages - 1;

    const pages: PageItem[] = [1];

    if (showLeftEllipsis) {
        pages.push(ELLIPSIS);
    } else {
        for (let page = 2; page < leftSibling; page += 1) {
            pages.push(page);
        }
    }

    for (let page = leftSibling; page <= rightSibling; page += 1) {
        if (page !== 1 && page !== totalPages) {
            pages.push(page);
        }
    }

    if (showRightEllipsis) {
        pages.push(ELLIPSIS);
    } else {
        for (let page = rightSibling + 1; page < totalPages; page += 1) {
            pages.push(page);
        }
    }

    pages.push(totalPages);

    return pages;
};


export default function ProductsGrid({ products }: ProductsGridProps) {

    const { t } = useTranslation('catalog');
    const allProducts = useMemo(() => products, [products]);

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


    const pageItems = useMemo(
        () => getPageNumbers(currentPage, totalPages),
        [currentPage, totalPages]
    );


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

            <nav className={styles.pagination} aria-label={t('pagination.label')}>

                <button
                    className={styles.pageButton}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label={t('pagination.previous')}
                >
                    ◀
                </button>

                <div className={styles.pageNumbers}>
                    {pageItems.map((item, index) =>
                        item === ELLIPSIS ? (
                            <span
                                key={`ellipsis-${index}`}
                                className={styles.pageEllipsis}
                                aria-hidden="true"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                className={
                                    item === currentPage
                                        ? `${styles.pageNumber} ${styles.pageNumberActive}`
                                        : styles.pageNumber
                                }
                                onClick={() => goToPage(item)}
                                aria-current={item === currentPage ? 'page' : undefined}
                            >
                                {item}
                            </button>
                        )
                    )}
                </div>

                <button
                    className={styles.pageButton}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label={t('pagination.next')}
                >
                    ▶
                </button>

            </nav>

        </section>

    );
}