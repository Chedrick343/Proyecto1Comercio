import { Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import SearchBar from '../search-bar/searchBar';
import ErrorState from '../error/ErrorState';
import errorStateStyles from '../error/ErrorState.module.css';
import { getCatalogReturnPath } from '../../catalog/catalogReturn';
import { getCatalogCategoryPath } from '../../catalog/catalogSearchParams';
import type { Product } from '../../utils/Products';
import ProductOverview from './ProductOverview';
import ProductSpecifications from './ProductSpecifications';
import RelatedProducts from './RelatedProducts';
import { useProduct } from './useProduct';

import styles from './ProductDetailPage.module.css';

function Breadcrumb({ product }: { product: Product }) {
    const { t } = useTranslation('product');
    const location = useLocation();
    const category = product.categories[product.categories.length - 1];

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

export default function ProductDetailPage() {
    const { t } = useTranslation(['product', 'errors', 'common']);
    const { productId } = useParams<{ productId: string }>();
    const { product, errorCode, isLoading } = useProduct(productId);

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
