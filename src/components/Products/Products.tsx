import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ProductsGrid.module.css';
import type { Product } from '../../utils/Products';


interface ProductsGridProps {
    products: Product[];
}


const PRODUCTS_PER_PAGE = 10;


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


// La última categoría del arreglo es la más específica
// ("Tecnología" > "Computadoras" > "Laptops")
const getMainCategory = (categories: string[]) =>
    categories.length > 0 ? categories[categories.length - 1] : 'Sin categoría';


export default function ProductsGrid({ products }: ProductsGridProps) {

    const allProducts = useMemo(() => products, [products]);

    const [currentPage, setCurrentPage] = useState(1);

    const scrollRef = useRef<HTMLDivElement>(null);


    const totalPages = Math.max(
        1,
        Math.ceil(allProducts.length / PRODUCTS_PER_PAGE)
    );


    // Si cambian los productos (por ejemplo al filtrar), volvemos a la página 1
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

        // Devuelve el scroll al inicio al cambiar de página
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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

        <section className={styles.products}>

            {/* =====================
                ENCABEZADO
            ===================== */}

            <header className={styles.productsHeader}>

                <h2 className={styles.productsTitle}>
                    Productos
                </h2>

                <span className={styles.productsCount}>
                    {allProducts.length} resultados
                </span>

            </header>


            {/* =====================
                CUADRÍCULA CON SCROLL
            ===================== */}

            <div className={styles.scrollArea} ref={scrollRef}>

                <div className={styles.grid}>

                    {visibleProducts.map((product) => (

                        <Link
                            key={product.objectID}
                            to={`/producto/${encodeURIComponent(product.objectID)}`}
                            className={styles.card}
                        >

                            {/* IMAGEN */}

                            <div className={styles.imageWrapper}>

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
                                    {formatPrice(product.price, product.currency)}
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