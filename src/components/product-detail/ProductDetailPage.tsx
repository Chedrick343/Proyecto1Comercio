/**
 * @fileoverview Página de detalle de un producto.
 */

import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import SearchBar from '../search-bar/searchBar';
import ErrorState from '../error/ErrorState';
import errorStateStyles from '../error/ErrorState.module.css';
import { getCatalogReturnPath } from '../../catalog/catalogReturn';
import { getCatalogCategoryPath } from '../../catalog/catalogSearchParams';
import { getMainCategory, type Product } from '../../utils/Products';
import ProductOverview from './ProductOverview';
import ProductSpecifications from './ProductSpecifications';
import RelatedProducts from './RelatedProducts';
import { useProduct } from './useProduct';
import { useTrackProductView } from '../../analytics/useTrackProductView';

import styles from './ProductDetailPage.module.css';

/**
 * Muestra la ruta de navegación: el catálogo (con la búsqueda recordada)
 * y la categoría principal del producto.
 *
 * @param props Propiedades del componente.
 * @param props.product Producto que se está viendo.
 * @return La ruta de navegación.
 */
function Breadcrumb({ product }: { product: Product }) {
    const { t } = useTranslation('product');
    const location = useLocation();
    const category = getMainCategory(product);

    return (
        <nav className={styles.breadcrumb} aria-label={t('breadcrumb.label')}>
            <ol>
                <li>
                    <Link to={getCatalogReturnPath(location.state)}>
                        {t('breadcrumb.catalog')}
                    </Link>
                </li>
                {category && (
                    <li>
                        <Link to={getCatalogCategoryPath(category)}>{category}</Link>
                    </li>
                )}
            </ol>
        </nav>
    );
}

/**
 * Muestra la imagen principal del producto.
 *
 * @param props Propiedades del componente.
 * @param props.product Producto que se está viendo.
 * @return La imagen del producto.
 */
function ProductImage({ product }: { product: Product }) {
    const { t } = useTranslation('product');

    return (
        <div className={styles.imagePanel}>
            <img className={styles.image} src={product.image_url} alt={product.title} />
            {!product.in_stock && (
                <span className={styles.outOfStockBadge}>{t('outOfStock')}</span>
            )}
        </div>
    );
}

/**
 * Carga el producto indicado en la URL y muestra su información,
 * especificaciones y productos relacionados, o un error si no se pudo cargar.
 *
 * @return La página del producto.
 */
export default function ProductDetailPage() {
    const { t } = useTranslation(['product', 'errors', 'common']);
    const { productId } = useParams<{ productId: string }>();
    const { product, errorCode, isLoading } = useProduct(productId);
    useTrackProductView(product);

    return (
        <main className="app">
            <div className="top-bar">
                <Header>
                    <div className="search-tools">
                        <SearchBar mode="submit" />
                    </div>
                </Header>
            </div>

            {isLoading && (
                <p className={styles.loading} role="status">{t('product:loading')}</p>
            )}

            {!isLoading && !product && (
                <ErrorState
                    title={t('errors:productLoad.title')}
                    description={t(`errors:productLoad.${errorCode ?? 'notFound'}`)}
                    actions={
                        <Link to="/" className={errorStateStyles.primaryAction}>
                            {t('common:actions.backToCatalog')}
                        </Link>
                    }
                />
            )}

            {product && (
                <div className={styles.page}>
                    <Breadcrumb product={product} />

                    <article className={styles.hero}>
                        <ProductImage product={product} />
                        <ProductOverview product={product} />
                    </article>

                    <ProductSpecifications facets={product.facets} />
                    <RelatedProducts product={product} />
                </div>
            )}

            <NavBar />
        </main>
    );
}
