import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import type { Product } from '../../utils/Products';
import { getProductById } from '../../utils/algolia';
import { getJewelryThemeVariables } from '../../theme/jewelryTheme';
import styles from './ProductDetailPage.module.css';

const jewelryThemeStyle = getJewelryThemeVariables();

const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);

const formatFacetName = (facetName: string) =>
    facetName
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatFacetValue = (facetValue: string | number | boolean) => {
    if (typeof facetValue === 'boolean') {
        return facetValue ? 'Sí' : 'No';
    }

    return String(facetValue);
};

export default function ProductDetailPage() {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // No real cart exists yet: this only gives the user visual confirmation.
    const [addedToCart, setAddedToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (!productId) {
            setErrorMessage('El producto solicitado no tiene un identificador válido.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setAddedToCart(false);
        setQuantity(1);

        getProductById(productId)
            .then(setProduct)
            .catch((error: unknown) => {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'No se pudo cargar el producto.'
                );
            })
            .finally(() => setIsLoading(false));
    }, [productId]);

    const handleAddToCart = () => {
        setAddedToCart(true);
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
                <p className={styles.stateMessage}>Cargando información del producto...</p>
                <NavBar />
            </main>
        );
    }

    if (errorMessage || !product) {
        return (
            <main className={`app ${styles.detailPage}`} style={jewelryThemeStyle}>
                <div className="top-bar">
                    <Header />
                </div>
                <p className={styles.stateMessage} role="alert">
                    {errorMessage ?? 'Producto no encontrado.'}
                </p>
                <Link className={styles.backLink} to="/">
                    ← Volver al catálogo
                </Link>
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
                    ← Volver al catálogo
                </Link>

                <article className={styles.productCard}>
                    <section className={styles.imageSection} aria-label="Imagen del producto">
                        <div className={styles.imageWrapper}>
                            <img
                                className={styles.productImage}
                                src={product.image_url}
                                alt={product.title}
                            />
                            {!product.in_stock && (
                                <span className={styles.stockBadge}>Agotado</span>
                            )}
                        </div>
                    </section>

                    <section className={styles.productInformation}>
                        <p className={styles.brand}>{product.brand}</p>
                        <h1 className={styles.title}>{product.title}</h1>
                        <p className={styles.price}>
                            {formatPrice(product.b2c.price, product.b2c.currency)}
                        </p>

                        <div className={styles.purchaseRow}>
                            <div className={styles.quantitySelector} aria-label="Cantidad a agregar">
                                <button
                                    type="button"
                                    onClick={handleDecreaseQuantity}
                                    disabled={!product.in_stock || quantity <= 1}
                                >
                                    −
                                </button>
                                <span aria-live="polite">{quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => handleIncreaseQuantity(product.stock_quantity)}
                                    disabled={!product.in_stock || quantity >= product.stock_quantity}
                                >
                                    +
                                </button>
                            </div>

                            <button
                                type="button"
                                className={styles.addToCartButton}
                                onClick={handleAddToCart}
                                disabled={!product.in_stock}
                            >
                                {addedToCart ? 'Agregado ✓' : 'Agregar al carrito'}
                            </button>
                        </div>

                        <div className={styles.summary}>
                            <p>
                                <strong>Disponibilidad:</strong>{' '}
                                {product.in_stock
                                    ? `${product.stock_quantity} unidades disponibles`
                                    : 'Producto agotado'}
                            </p>
                            <p>
                                <strong>Calificación:</strong> {product.rating} / 5
                            </p>
                        </div>

                        <div className={styles.detailSection}>
                            <h2>Descripción</h2>
                            <p>{product.description}</p>
                        </div>

                        <div className={styles.detailSection}>
                            <h2>Categorías</h2>
                            <div className={styles.categoryList}>
                                {product.categories.map((category) => (
                                    <span className={styles.category} key={category}>
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <h2>Especificaciones</h2>
                            <dl className={styles.specifications}>
                                <div>
                                    <dt>Identificador</dt>
                                    <dd>{product.objectID}</dd>
                                </div>
                                <div>
                                    <dt>Moneda</dt>
                                    <dd>{product.b2c.currency}</dd>
                                </div>
                                {Object.entries(product.facets).map(([facetName, facetValue]) => (
                                    <div key={facetName}>
                                        <dt>{formatFacetName(facetName)}</dt>
                                        <dd>{formatFacetValue(facetValue)}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>
                </article>
            </div>

            <NavBar />
        </main>
    );
}

