/**
 * @fileoverview Paginación con botones de anterior y siguiente y los números
 * de página. La usan el catálogo y las tablas del panel administrativo.
 */

import { useTranslation } from 'react-i18next';

import styles from './Pagination.module.css';

/** Cantidad de páginas que se muestran a cada lado de la página actual. */
const SIBLING_COUNT = 1;

/** Marcador de páginas omitidas en la paginación. */
const ELLIPSIS = 'ellipsis' as const;

/** Elemento de la paginación: un número de página o puntos suspensivos. */
type PageItem = number | typeof ELLIPSIS;

/**
 * Calcula los elementos de la paginación. Siempre incluye la primera y la
 * última página, las páginas vecinas a la actual y puntos suspensivos donde
 * se omiten páginas.
 *
 * @param currentPage Página actual.
 * @param totalPages Total de páginas.
 * @return Los números de página y los puntos suspensivos, en orden.
 */
function getPageItems(currentPage: number, totalPages: number): PageItem[] {
    // Primera, última, la actual, sus vecinas y los dos puntos suspensivos.
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
}

/** Propiedades de Pagination. */
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    /** Etiqueta accesible de la paginación, por ejemplo "Paginación de órdenes". */
    label: string;
}

/**
 * Muestra la paginación. En pantallas pequeñas cambia los números de página
 * por "Página 2 de 8". No muestra nada si hay una sola página.
 *
 * @param props Propiedades del componente.
 * @return La barra de paginación, o null si no hace falta.
 */
export default function Pagination({ currentPage, totalPages, onPageChange, label }: PaginationProps) {
    const { t } = useTranslation('common');

    if (totalPages <= 1) {
        return null;
    }

    return (
        <nav className={styles.pagination} aria-label={label}>
            <button
                type="button"
                className={styles.pageButton}
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label={t('pagination.previous')}
            >
                ◀
            </button>

            <div className={styles.pageNumbers}>
                {getPageItems(currentPage, totalPages).map((item, index) =>
                    item === ELLIPSIS ? (
                        <span key={`ellipsis-${index}`} className={styles.pageEllipsis} aria-hidden="true">
                            …
                        </span>
                    ) : (
                        <button
                            key={item}
                            type="button"
                            className={
                                item === currentPage
                                    ? `${styles.pageNumber} ${styles.pageNumberActive}`
                                    : styles.pageNumber
                            }
                            onClick={() => onPageChange(item)}
                            aria-current={item === currentPage ? 'page' : undefined}
                        >
                            {item}
                        </button>
                    )
                )}
            </div>

            {/* En pantallas pequeñas reemplaza a los números de página */}
            <span className={styles.pageStatus} aria-live="polite">
                {t('pagination.status', { current: currentPage, total: totalPages })}
            </span>

            <button
                type="button"
                className={styles.pageButton}
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label={t('pagination.next')}
            >
                ▶
            </button>
        </nav>
    );
}
