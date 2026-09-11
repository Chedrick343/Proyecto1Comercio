import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaThLarge, FaList } from 'react-icons/fa';
import styles from './ProductsGrid.module.css';
import type { Product } from '../../utils/Products';


interface ProductsGridProps {
    products: Product[];
}


type ViewMode = 'grid' | 'list';


const PRODUCTS_PER_PAGE = 12;


/* =====================
   UTILIDADES
===================== */
const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);



const getMainCategory = (categories: string[]) =>
    categories.length > 0 ? categories[categories.length - 1] : 'Sin categoría';


export default function ProductsGrid({ products }: ProductsGridProps) {

    const allProducts = useMemo(() => products, [products]);

    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const sectionRef = useRef<HTMLElement>(null);


    const totalPages = Math.max(
        1,
        Math.ceil(allProducts.length / PRODUCTS_PER_PAGE)
    );


    // Si cambian los productos volvemos a la página 1
    useEffect(() => {
        setCurrentPage(1);
    }, [allProducts]);


    // Productos visibles en la página actual
    const visibleProducts = useMemo(() => {

        const start = (currentPage - 1) * PRODUCTS_PER_PAGE;

        return allProducts.slice(start, start + PRODUCTS_PER_PAGE);

    }, [allProducts, currentPage]);


    const goToPage = (page: number) => {

        if (page < 1 || page > totalPages) {
            return;
        }

        setCurrentPage(page);

        // Vuelve al inicio de la sección de productos al cambiar de página
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };


     /* =====================
         ESTADO VACÍO
     ===================== */

     if (allProducts.length === 0) {
        return (
            <section className={styles.products}>
                <p className={styles.emptyState}>
                    No hay productos que coincidan con los filtros. Probá quitando alguno.
                </p>
            </section>
        );
    }


    return (

        <section className={styles.products} ref={sectionRef}>

            {/* =====================
                ENCABEZADO
            ===================== */}

            <header className={styles.productsHeader}>

                <h2 className={styles.productsTitle}>
                    Productos
                </h2>

                <div className={styles.headerRight}>

                    <span className={styles.productsCount}>
                        {allProducts.length} resultados
                    </span>

                    <div className={styles.viewToggle} role="group" aria-label="Tipo de vista">

                        <button
                            type="button"
                            className={`${styles.viewButton} ${
                                viewMode === 'grid' ? styles.viewButtonActive : ''
                            }`}
                            onClick={() => setViewMode('grid')}
                            aria-pressed={viewMode === 'grid'}
                        >
                            <FaThLarge aria-hidden="true" />
                            <span className={styles.srOnly}>Ver en cuadrícula</span>
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
                            <span className={styles.srOnly}>Ver en lista</span>
                        </button>

                    </div>

                </div>

            </header>


            {/* =====================
                CUADRÍCULA
            ===================== */}

            <div className={styles.scrollArea}>

                <div className={viewMode === 'grid' ? styles.grid : styles.list}>

                    {visibleProducts.map((product) => (

                        <Link
                            key={product.objectID}
                            to={`/producto/${encodeURIComponent(product.objectID)}`}
                            className={
                                viewMode === 'list'
                                    ? `${styles.card} ${styles.listCard}`
                                    : styles.card
                            }
                        >

                            {/* IMAGEN */}

                            <div className={viewMode === 'list' ? styles.listImageWrapper : styles.imageWrapper}>

                                <img
                                    src={product.image_url}
                                    alt={product.title}
                                    className={styles.image}
                                    loading="lazy"
                                />

                                {!product.in_stock && (
                                    <span className={styles.outOfStock}>
                                        Agotado
                                    </span>
                                )}

                            </div>


                            {/* INFORMACIÓN */}

                            <div className={styles.cardBody}>

                                <span className={styles.category}>
                                    {getMainCategory(product.categories)}
                                </span>

                                <h3 className={styles.cardTitle}>
                                    {product.title}
                                </h3>

                                <p className={styles.price}>
                                    {formatPrice(product.b2c.price, product.b2c.currency)}
                                </p>

                            </div>

                        </Link>

                    ))}

                </div>

            </div>


            {/* =====================
                PAGINACIÓN
            ===================== */}

            <nav className={styles.pagination} aria-label="Paginación de productos">

                <button
                    className={styles.pageButton}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    ◀ Anterior
                </button>


                <div className={styles.pageNumbers}>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                        (page) => (

                            <button
                                key={page}
                                className={
                                    page === currentPage
                                        ? `${styles.pageNumber} ${styles.pageNumberActive}`
                                        : styles.pageNumber
                                }
                                onClick={() => goToPage(page)}
                                aria-current={page === currentPage ? 'page' : undefined}
                            >
                                {page}
                            </button>

                        )
                    )}

                </div>


                <button
                    className={styles.pageButton}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Siguiente ▶
                </button>

            </nav>

        </section>

    );
}