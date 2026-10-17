import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import ErrorState from '../error/ErrorState';
import errorStateStyles from '../error/ErrorState.module.css';
import type { Product } from '../../utils/Products';
import {
    getProductById,
    ProductLoadError,
    type ProductLoadErrorCode
} from '../../utils/algolia';
import { formatCurrency } from '../../utils/formatCurrency';
import { getJewelryThemeVariables } from '../../theme/jewelryTheme';
import styles from './ProductDetailPage.module.css';
import {useCart} from '../../context/CartContext.tsx';

const jewelryThemeStyle = getJewelryThemeVariables();

const formatFacetName = (facetName: string) =>
    facetName
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getProductLoadErrorCode = (error: unknown): ProductLoadErrorCode =>
    error instanceof ProductLoadError ? error.code : 'unavailable';

export default function ProductDetailPage() {
    const { t } = useTranslation(['product', 'errors', 'common']);
    const facetLabels: Record<string, string | undefined> = t('product:facets', { returnObjects: true });
    const { addProduct } = useCart();
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorCode, setErrorCode] = useState<ProductLoadErrorCode | null>(null);

    const [addedToCart, setAddedToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const cartDialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (!productId) {
            setErrorCode('notFound');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrorCode(null);
        setAddedToCart(false);
        setQuantity(1);

        getProductById(productId)
            .then(setProduct)
            .catch((error: unknown) => setErrorCode(getProductLoadErrorCode(error)))
            .finally(() => setIsLoading(false));
    }, [productId]);

    const getFacetLabel = (facetName: string) =>
        facetLabels[facetName] ?? formatFacetName(facetName);

    const formatFacetValue = (facetValue: string | number | boolean) =>
        typeof facetValue === 'boolean'
            ? t(facetValue ? 'common:yes' : 'common:no')
            : String(facetValue);

    const handleAddToCart = () => {
        if (!product || addedToCart) {
            return;
        }

        addProduct(product, quantity);
        setAddedToCart(true);
        cartDialogRef.current?.showModal();
    };

    const handleDecreaseQuantity = () => {
        setQuantity((current) => Math.max(1, current - 1));
        setAddedToCart(false);
    };

    const handleIncreaseQuantity = (maxQuantity: number) => {
        setQuantity((current) => Math.min(maxQuantity, current + 1));
        setAddedToCart(false);
    };

    if (isLoading) {
        return (
            <main className={`app ${styles.detailPage}`} style={jewelryThemeStyle}>
                <div className="top-bar">
                    <Header />
                </div>
                <p className={styles.stateMessage}>{t('product:loading')}</p>
                <NavBar />
            </main>
        );
    }

    if (errorCode || !product) {
        return (
            <main className={`app ${styles.detailPage}`} style={jewelryThemeStyle}>
                <div className="top-bar">
                    <Header />
                </div>
                <ErrorState
                    title={t('errors:productLoad.title')}
                    description={t(`errors:productLoad.${errorCode ?? 'notFound'}`)}
                    actions={
                        <Link to="/" className={errorStateStyles.primaryAction}>
                            {t('common:actions.backToCatalog')}
                        </Link>
                    }
                />
                <NavBar />
            </main>
        );
    }

    return (
        <main className={`app ${styles.detailPage}`} style={jewelryThemeStyle}>
            <div className="top-bar">
                <Header />
            </div>

            <div className={styles.content}>
                <Link className={styles.backLink} to="/">
                    ← {t('common:actions.backToCatalog')}
                </Link>

                <article className={styles.productCard}>
                    <section className={styles.imageSection} aria-label={t('product:imageLabel')}>
                        <div className={styles.imageWrapper}>
                            <img
                                className={styles.productImage}
                                src={product.image_url}
                                alt={product.title}
                            />
                            {!product.in_stock && (
                                <span className={styles.stockBadge}>{t('product:outOfStock')}</span>
                            )}
                        </div>
                    </section>

                    <section className={styles.productInformation}>
                        <p className={styles.brand}>{product.brand}</p>
                        <h1 className={styles.title}>{product.title}</h1>
                        <p className={styles.price}>
                            {formatCurrency(product.b2c.price, product.b2c.currency)}
                        </p>

                        <div className={styles.purchaseRow}>
                            <div className={styles.quantitySelector} aria-label={t('product:quantity.label')}>
                                <button
                                    type="button"
                                    onClick={handleDecreaseQuantity}
                                    disabled={!product.in_stock || quantity <= 1}
                                    aria-label={t('product:quantity.decrease')}
                                >
                                    −
                                </button>
                                <span aria-live="polite">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => handleIncreaseQuantity(product.stock_quantity)}
                                    disabled={!product.in_stock || quantity >= product.stock_quantity}
                                    aria-label={t('product:quantity.increase')}
                                >
                                    +
                                </button>
                            </div>

                            <button
                                type="button"
                                className={styles.addToCartButton}
                                onClick={handleAddToCart}
                                disabled={!product.in_stock || addedToCart}
                            >
                                {addedToCart ? t('product:addedToCart') : t('product:addToCart')}
                            </button>
                        </div>

                        <div className={styles.summary}>
                            <p>
                                <strong>{t('product:availability.label')}</strong>{' '}
                                {product.in_stock
                                    ? t('product:availability.inStock', { count: product.stock_quantity })
                                    : t('product:availability.outOfStock')}
                            </p>
                            <p>
                                <strong>{t('product:rating.label')}</strong>{' '}
                                {t('product:rating.value', { rating: product.rating })}
                            </p>
                        </div>

                        <div className={styles.detailSection}>
                            <h2>{t('product:sections.description')}</h2>
                            <p>{product.description}</p>
                        </div>

                        <div className={styles.detailSection}>
                            <h2>{t('product:sections.categories')}</h2>
                            <div className={styles.categoryList}>
                                {product.categories.map((category) => (
                                    <span className={styles.category} key={category}>
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <h2>{t('product:sections.specifications')}</h2>
                            <dl className={styles.specifications}>
                                <div>
                                    <dt>{t('product:specifications.id')}</dt>
                                    <dd>{product.objectID}</dd>
                                </div>
                                <div>
                                    <dt>{t('product:specifications.currency')}</dt>
                                    <dd>{product.b2c.currency}</dd>
                                </div>
                                {Object.entries(product.facets).map(([facetName, facetValue]) => (
                                    <div key={facetName}>
                                        <dt>{getFacetLabel(facetName)}</dt>
                                        <dd>{formatFacetValue(facetValue)}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>
                </article>
            </div>

            <dialog
                ref={cartDialogRef}
                className={styles.addedDialog}
                aria-labelledby="cart-added-title"
                onClick={(event) => {
                    if (event.target === event.currentTarget) {
                        event.currentTarget.close();
                    }
                }}
            >
                <div className={styles.modalContent}>
                    <span className={styles.modalCheck} aria-hidden="true">✓</span>
                    <p className={styles.modalEyebrow}>{t('product:addedDialog.eyebrow')}</p>
                    <h2 id="cart-added-title" className={styles.modalTitle}>
                        {t('product:addedDialog.title')}
                    </h2>
                    <p className={styles.modalProduct}>
                        {quantity} × {product.title}
                    </p>
                    <p className={styles.modalDescription}>
                        {t('product:addedDialog.description')}
                    </p>
                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            className={styles.modalSecondary}
                            onClick={() => cartDialogRef.current?.close()}
                        >
                            {t('common:actions.continueShopping')}
                        </button>
                        <Link
                            to="/carrito"
                            className={styles.modalPrimary}
                            onClick={() => cartDialogRef.current?.close()}
                        >
                            {t('product:addedDialog.goToCart')}
                        </Link>
                    </div>
                </div>
            </dialog>

            <NavBar />
        </main>
    );
}

