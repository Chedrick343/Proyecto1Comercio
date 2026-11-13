/**
 * @fileoverview Carrusel de productos con flechas para las secciones personalizadas.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import type { ProductSnapshot } from '../../activity/analyticsTypes';
import { getCatalogReturnState } from '../../catalog/catalogReturn';
import { usePriceTier } from '../../pricing/usePriceTier';
import { formatCurrency } from '../../utils/formatCurrency';

import styles from './ProductCarousel.module.css';

/** Margen en píxeles para considerar que el carrusel llegó a un extremo. */
const SCROLL_EDGE_TOLERANCE_PX = 2;

/** Propiedades de ProductCarousel. */
interface ProductCarouselProps {
    title: string;
    /** Texto breve que explica por qué se muestran estos productos. */
    description?: string;
    products: ProductSnapshot[];
    /** Clase adicional de la sección. */
    className?: string;
}

/** Hacia dónde puede avanzar el carrusel. */
interface ScrollState {
    canScrollPrevious: boolean;
    canScrollNext: boolean;
}

/**
 * Indica si el usuario pidió reducir las animaciones.
 *
 * @return Verdadero si el sistema prefiere movimiento reducido.
 */
const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Muestra un producto del carrusel con el precio del usuario actual. Toda la
 * tarjeta enlaza al detalle.
 *
 * @param props Propiedades del componente.
 * @param props.product Resumen del producto.
 * @return La tarjeta del producto.
 */
function CarouselCard({ product }: { product: ProductSnapshot }) {
    const { t } = useTranslation('catalog');
    const location = useLocation();
    const tier = usePriceTier();
    // Los resúmenes antiguos no tienen precio B2B; en ese caso se muestra el B2C.
    const displayedPrice = tier === 'B2B' && product.businessPrice !== undefined
        ? product.businessPrice
        : product.price;

    return (
        <li className={styles.card}>
            <div className={styles.imageWrapper}>
                <img src={product.imageUrl} alt="" className={styles.image} loading="lazy" />
            </div>

            <div className={styles.cardBody}>
                <span className={styles.category}>
                    {product.category ?? t('product.uncategorized')}
                </span>

                <h3 className={styles.cardTitle}>
                    {/* The link stretches over the whole card (see .cardLink::after). */}
                    <Link
                        to={`/producto/${encodeURIComponent(product.productId)}`}
                        state={getCatalogReturnState(location)}
                        className={styles.cardLink}
                    >
                        {product.title}
                    </Link>
                </h3>

                <p className={styles.brand}>{product.brand}</p>
                <p className={styles.price}>{formatCurrency(displayedPrice, product.currency)}</p>
            </div>
        </li>
    );
}

/**
 * Muestra productos en una fila que avanza con flechas, una página a la vez.
 * Las flechas solo aparecen si los productos no caben; en pantallas táctiles
 * también se puede deslizar.
 *
 * @param props Propiedades del componente.
 * @return La sección, o null si no hay productos.
 */
export default function ProductCarousel({
    title,
    description,
    products,
    className
}: ProductCarouselProps) {
    const { t } = useTranslation('catalog');
    const headingId = useId();
    const trackRef = useRef<HTMLUListElement>(null);
    const [scrollState, setScrollState] = useState<ScrollState>({
        canScrollPrevious: false,
        canScrollNext: false
    });

    useEffect(() => {
        const track = trackRef.current;

        if (!track) {
            return;
        }

        /** Revisa si quedan productos ocultos a cada lado. */
        const updateScrollState = () => setScrollState({
            canScrollPrevious: track.scrollLeft > SCROLL_EDGE_TOLERANCE_PX,
            canScrollNext:
                track.scrollLeft + track.clientWidth < track.scrollWidth - SCROLL_EDGE_TOLERANCE_PX
        });

        // The observer also runs once right away, which sets the initial state.
        const resizeObserver = new ResizeObserver(updateScrollState);
        resizeObserver.observe(track);
        track.addEventListener('scroll', updateScrollState, { passive: true });

        return () => {
            resizeObserver.disconnect();
            track.removeEventListener('scroll', updateScrollState);
        };
    }, [products]);

    if (products.length === 0) {
        return null;
    }

    /**
     * Avanza o retrocede una página de productos.
     *
     * @param direction 1 para avanzar, -1 para retroceder.
     */
    const scrollPage = (direction: 1 | -1) => {
        const track = trackRef.current;

        track?.scrollBy({
            left: direction * track.clientWidth,
            behavior: prefersReducedMotion() ? 'auto' : 'smooth'
        });
    };

    const hasHiddenProducts = scrollState.canScrollPrevious || scrollState.canScrollNext;
    const sectionClassName = [styles.carousel, className].filter(Boolean).join(' ');

    return (
        <section className={sectionClassName} aria-labelledby={headingId}>
            <header className={styles.header}>
                <h2 id={headingId} className={styles.title}>{title}</h2>
                {description && <p className={styles.description}>{description}</p>}
            </header>

            <div className={styles.viewport}>
                {hasHiddenProducts && (
                    <button
                        type="button"
                        className={`${styles.arrow} ${styles.previousArrow}`}
                        onClick={() => scrollPage(-1)}
                        disabled={!scrollState.canScrollPrevious}
                        aria-label={t('personalization.carousel.previous', { title })}
                    >
                        <FaChevronLeft aria-hidden="true" />
                    </button>
                )}

                <ul ref={trackRef} className={styles.track}>
                    {products.map((product) => (
                        <CarouselCard key={product.productId} product={product} />
                    ))}
                </ul>

                {hasHiddenProducts && (
                    <button
                        type="button"
                        className={`${styles.arrow} ${styles.nextArrow}`}
                        onClick={() => scrollPage(1)}
                        disabled={!scrollState.canScrollNext}
                        aria-label={t('personalization.carousel.next', { title })}
                    >
                        <FaChevronRight aria-hidden="true" />
                    </button>
                )}
            </div>
        </section>
    );
}
