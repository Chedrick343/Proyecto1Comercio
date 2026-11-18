/**
 * @fileoverview Consulta de productos e inventario en el panel
 * administrativo: precios, condición B2B, stock y estado de cada producto,
 * con el detalle de unidades por sucursal y la edición de precios e
 * inventario al expandir la fila.
 */

import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FaBoxOpen,
    FaChevronDown,
    FaExclamationTriangle,
    FaExternalLinkAlt,
    FaGem,
    FaStore
} from 'react-icons/fa';

import { getStockByBranch } from '../../inventory/branchInventory';
import { getBusinessMinimum } from '../../pricing/businessMinimum';
import { getCustomerPrice } from '../../pricing/customerPrice';
import { getStockStatusForUnits, type StockStatus } from '../../product/productSpecifications';
import { formatCurrency } from '../../utils/formatCurrency';
import { normalizeText } from '../../utils/normalizeText';
import { getMainCategory, type Product } from '../../utils/Products';
import Pagination from '../pagination/Pagination';
import DropdownSelect from '../select/DropdownSelect';
import SearchField from '../select/SearchField';
import AdminProductDetail from './AdminProductDetail';
import CollapsibleFilters from './CollapsibleFilters';
import StatTile from './StatTile';
import { useAdminProducts } from './useAdminProducts';

import statStyles from './StatTile.module.css';
import styles from './AdminTable.module.css';

/** Cantidad de productos por página. */
const PRODUCTS_PER_PAGE = 10;

/** Valor de un filtro que no restringe nada. */
const ALL_FILTER = 'ALL';

/** Filtro de disponibilidad de la consulta. */
type AvailabilityFilter = typeof ALL_FILTER | 'OUT_OF_STOCK' | 'MISSING_IN_BRANCH' | 'LOW_STOCK';

/** Filtros de disponibilidad, en el orden en que se muestran. */
const AVAILABILITY_FILTERS: AvailabilityFilter[] = [ALL_FILTER, 'OUT_OF_STOCK', 'MISSING_IN_BRANCH', 'LOW_STOCK'];

/** Clase de estilo de la etiqueta de cada nivel de disponibilidad. */
const STOCK_TAG_CLASS: Record<StockStatus, string> = {
    available: styles.tagOk,
    lowStock: styles.tagWarning,
    outOfStock: styles.tagProblem
};

/**
 * Indica si un producto no se puede vender a algún tipo de cliente por su
 * información comercial.
 *
 * @param product Producto a revisar.
 * @return Verdadero si su precio B2C o B2B no es válido.
 */
const hasPriceProblem = (product: Product): boolean =>
    getCustomerPrice(product, 'B2C').problem !== null || getCustomerPrice(product, 'B2B').problem !== null;

/**
 * Indica si un producto cumple el filtro de disponibilidad.
 *
 * @param product Producto a revisar.
 * @param filter Filtro elegido.
 * @return Verdadero si el producto debe mostrarse.
 */
function matchesAvailability(product: Product, filter: AvailabilityFilter): boolean {
    const branchStocks = getStockByBranch(product).map((branchStock) => branchStock.stock);

    if (filter === 'OUT_OF_STOCK') {
        return product.stock_quantity === 0;
    }

    if (filter === 'MISSING_IN_BRANCH') {
        return product.stock_quantity > 0 && branchStocks.some((stock) => stock === 0);
    }

    if (filter === 'LOW_STOCK') {
        return branchStocks.some((stock) => getStockStatusForUnits(stock) === 'lowStock');
    }

    return true;
}

/**
 * Muestra el resumen del catálogo: productos activos, agotados, con stock
 * bajo en alguna sucursal y con precio inválido.
 *
 * @param props Propiedades del componente.
 * @param props.products Todos los productos.
 * @return La fila de tarjetas.
 */
function ProductsSummary({ products }: { products: Product[] }) {
    const { t } = useTranslation('admin');
    const activeCount = products.filter((product) => product.active).length;

    return (
        <dl className={statStyles.tiles} aria-label={t('products.summary.label')}>
            <StatTile
                icon={FaGem}
                label={t('products.summary.products')}
                value={String(products.length)}
                detail={t('products.summary.productsDetail', { count: activeCount })}
            />
            <StatTile
                icon={FaBoxOpen}
                label={t('products.summary.outOfStock')}
                value={String(products.filter((product) => matchesAvailability(product, 'OUT_OF_STOCK')).length)}
                detail={t('products.summary.outOfStockDetail')}
            />
            <StatTile
                icon={FaStore}
                label={t('products.summary.lowStock')}
                value={String(products.filter((product) => matchesAvailability(product, 'LOW_STOCK')).length)}
                detail={t('products.summary.lowStockDetail')}
            />
            <StatTile
                icon={FaExclamationTriangle}
                label={t('products.summary.invalidPrice')}
                value={String(products.filter(hasPriceProblem).length)}
                detail={t('products.summary.invalidPriceDetail')}
            />
        </dl>
    );
}

/**
 * Muestra el estado de venta de un producto: inactivo, con precio inválido
 * o activo.
 *
 * @param props Propiedades del componente.
 * @param props.product Producto a revisar.
 * @return La etiqueta del estado.
 */
function ProductStatusTag({ product }: { product: Product }) {
    const { t } = useTranslation('admin');

    if (!product.active) {
        return <span className={`${styles.tag} ${styles.tagProblem}`}>{t('products.status.inactive')}</span>;
    }

    if (hasPriceProblem(product)) {
        return <span className={`${styles.tag} ${styles.tagWarning}`}>{t('products.status.invalidPrice')}</span>;
    }

    return <span className={`${styles.tag} ${styles.tagOk}`}>{t('products.status.active')}</span>;
}

/**
 * Muestra los productos del catálogo con un resumen, búsqueda, filtros por
 * categoría y disponibilidad, y paginación. Cada fila se puede expandir para
 * ver las unidades del producto en cada sucursal y, como administrador,
 * editar sus precios, su mínimo B2B y su inventario.
 *
 * @return La consulta de productos e inventario.
 */
export default function AdminProductsList() {
    const { t } = useTranslation('admin');
    const { products, isLoading, hasError, reloadProducts } = useAdminProducts();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState(ALL_FILTER);
    const [availability, setAvailability] = useState<AvailabilityFilter>(ALL_FILTER);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

    const categories = [...new Set(products.map(getMainCategory).filter(Boolean) as string[])]
        .sort((first, second) => first.localeCompare(second, 'es'));
    const term = normalizeText(search);
    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            term === '' || normalizeText(`${product.title} ${product.sku} ${product.brand}`).includes(term);
        const matchesCategory = category === ALL_FILTER || product.categories.includes(category);

        return matchesSearch && matchesCategory && matchesAvailability(product, availability);
    });
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
    const page = Math.min(currentPage, totalPages);
    const activeFilterCount = [category, availability].filter((value) => value !== ALL_FILTER).length;
    const visibleProducts = filteredProducts.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

    /**
     * Aplica un cambio de filtro y vuelve a la primera página.
     *
     * @param applyChange Función que cambia el filtro.
     */
    const changeFilter = (applyChange: () => void) => {
        applyChange();
        setCurrentPage(1);
        setExpandedProductId(null);
    };

    /**
     * Expande la fila de un producto, o la cierra si ya estaba expandida.
     *
     * @param productId Identificador del producto.
     */
    const toggleProduct = (productId: string) => {
        setExpandedProductId(expandedProductId === productId ? null : productId);
    };

    return (
        <section className={styles.section} aria-labelledby="admin-products-heading">
            <header className={styles.header}>
                <div>
                    <h2 id="admin-products-heading" className={styles.heading}>{t('products.title')}</h2>
                    <p className={styles.description}>{t('products.description')}</p>
                </div>
            </header>

            {hasError && <p className={styles.errorNote} role="alert">{t('products.loadError')}</p>}

            <ProductsSummary products={products} />

            <div className={styles.filters}>
                <div className={styles.searchFilter}>
                    <SearchField
                        label={t('products.filters.search')}
                        value={search}
                        placeholder={t('products.filters.searchPlaceholder')}
                        onChange={(value) => changeFilter(() => setSearch(value))}
                    />
                </div>
                <CollapsibleFilters activeCount={activeFilterCount}>
                    <DropdownSelect
                        layout="stacked"
                        label={t('products.filters.category')}
                        value={category}
                        onChange={(value) => changeFilter(() => setCategory(value))}
                        options={[
                            { value: ALL_FILTER, label: t('products.filters.allCategories') },
                            ...categories.map((categoryName) => ({ value: categoryName, label: categoryName }))
                        ]}
                    />
                    <DropdownSelect
                        layout="stacked"
                        label={t('products.filters.availability')}
                        value={availability}
                        onChange={(value) => changeFilter(() => setAvailability(value as AvailabilityFilter))}
                        options={AVAILABILITY_FILTERS.map((filter) => ({
                            value: filter,
                            label: t(`products.filters.availabilityOptions.${filter}`)
                        }))}
                    />
                    </CollapsibleFilters>
            </div>

            <p className={styles.count}>
                {isLoading
                    ? t('products.loading')
                    : t('products.count', { count: filteredProducts.length, total: products.length })}
            </p>

            {!isLoading && filteredProducts.length === 0 && !hasError && (
                <p className={styles.emptyNote}>{t('products.noMatches')}</p>
            )}

            {visibleProducts.length > 0 && (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th scope="col">{t('products.columns.product')}</th>
                                <th scope="col">{t('products.columns.category')}</th>
                                <th scope="col">{t('products.columns.retailPrice')}</th>
                                <th scope="col">{t('products.columns.businessPrice')}</th>
                                <th scope="col" className={styles.centerCell}>{t('products.columns.businessMinimum')}</th>
                                <th scope="col">{t('products.columns.totalStock')}</th>
                                <th scope="col">{t('products.columns.status')}</th>
                                <th scope="col">
                                    <span className={styles.visuallyHidden}>{t('products.columns.open')}</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleProducts.map((product) => {
                                const isExpanded = expandedProductId === product.objectID;
                                const detailId = `branch-stock-${product.objectID}`;

                                return (
                                    <Fragment key={product.objectID}>
                                        <tr
                                            className={
                                                isExpanded
                                                    ? `${styles.rowClickable} ${styles.rowExpanded}`
                                                    : styles.rowClickable
                                            }
                                            onClick={() => toggleProduct(product.objectID)}
                                        >
                                            <td data-label={t('products.columns.product')} className={styles.cellProduct}>
                                                <div className={styles.productCell}>
                                                    <button
                                                        type="button"
                                                        className={styles.expandButton}
                                                        aria-expanded={isExpanded}
                                                        aria-controls={detailId}
                                                        aria-label={t('products.toggleBranchStock', { name: product.title })}
                                                        onClick={(event) => {
                                                            // La fila también reacciona al clic; así no se cambia dos veces.
                                                            event.stopPropagation();
                                                            toggleProduct(product.objectID);
                                                        }}
                                                    >
                                                        <FaChevronDown aria-hidden="true" />
                                                    </button>
                                                    <img src={product.image_url} alt="" className={styles.productImage} />
                                                    <span className={styles.productText}>
                                                        <span className={styles.primaryText} title={product.title}>
                                                            {product.title}
                                                        </span>
                                                        <span className={styles.secondaryText} title={`${product.sku} · ${product.brand}`}>
                                                            {product.sku} · {product.brand}
                                                        </span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td data-label={t('products.columns.category')} className={styles.cellCategory}>
                                                {getMainCategory(product) ?? '-'}
                                            </td>
                                            <td
                                                data-label={t('products.columns.retailPrice')}
                                                data-short={t('products.shortLabels.retailPrice')}
                                                className={`${styles.numberCell} ${styles.cellPrice}`}
                                            >
                                                {formatCurrency(product.b2c.price, product.b2c.currency)}
                                            </td>
                                            <td
                                                data-label={t('products.columns.businessPrice')}
                                                data-short={t('products.shortLabels.businessPrice')}
                                                className={`${styles.numberCell} ${styles.cellPrice}`}
                                            >
                                                {formatCurrency(product.b2b.price, product.b2b.currency)}
                                            </td>
                                            <td
                                                data-label={t('products.columns.businessMinimum')}
                                                data-short={t('products.shortLabels.businessMinimum')}
                                                className={`${styles.numberCell} ${styles.centerCell} ${styles.cellPrice}`}
                                            >
                                                {getBusinessMinimum(product)}
                                            </td>
                                            <td data-label={t('products.columns.totalStock')} className={`${styles.numberCell} ${styles.cellStock}`}>
                                                <span className={`${styles.tag} ${STOCK_TAG_CLASS[getStockStatusForUnits(product.stock_quantity)]}`}>
                                                    {t('products.units', { count: product.stock_quantity })}
                                                </span>
                                            </td>
                                            <td data-label={t('products.columns.status')} className={styles.cellStatus}>
                                                <ProductStatusTag product={product} />
                                            </td>
                                            <td className={styles.cellOpen}>
                                                <Link
                                                    to={`/producto/${encodeURIComponent(product.objectID)}`}
                                                    className={styles.openButton}
                                                    aria-label={t('products.openProduct', { name: product.title })}
                                                    title={t('products.openProduct', { name: product.title })}
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <FaExternalLinkAlt aria-hidden="true" />
                                                </Link>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr id={detailId} className={styles.detailRow}>
                                                <td colSpan={8}>
                                                    <AdminProductDetail product={product} onProductChanged={reloadProducts} />
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(nextPage) => {
                    setCurrentPage(nextPage);
                    setExpandedProductId(null);
                }}
                label={t('products.paginationLabel')}
            />
        </section>
    );
}
