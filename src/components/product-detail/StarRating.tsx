/**
 * @fileoverview Calificación del producto representada con estrellas.
 */

import { useTranslation } from 'react-i18next';
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa';

import styles from './ProductDetailPage.module.css';

/** Calificación máxima posible. */
const MAX_STARS = 5;

/**
 * Elige el ícono de una estrella según la calificación.
 *
 * @param position Posición de la estrella, empezando en 1.
 * @param rating Calificación del producto.
 * @return El ícono de estrella llena, media o vacía.
 */
function getStarIcon(position: number, rating: number) {
    if (rating >= position) {
        return FaStar;
    }

    return rating >= position - 0.5 ? FaStarHalfAlt : FaRegStar;
}

/**
 * Muestra la calificación con estrellas y su valor numérico.
 *
 * @param props Propiedades del componente.
 * @param props.rating Calificación, de 0 a MAX_STARS.
 * @return La calificación con su descripción accesible.
 */
export default function StarRating({ rating }: { rating: number }) {
    const { t } = useTranslation('product');

    return (
        <p className={styles.rating} aria-label={t('rating.label', { rating })}>
            <span className={styles.stars} aria-hidden="true">
                {Array.from({ length: MAX_STARS }, (_, index) => {
                    const StarIcon = getStarIcon(index + 1, rating);
                    return <StarIcon key={index} />;
                })}
            </span>
            <span aria-hidden="true">{rating.toFixed(1)}</span>
        </p>
    );
}
