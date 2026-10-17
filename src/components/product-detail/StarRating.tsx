import { useTranslation } from 'react-i18next';
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa';

import styles from './ProductDetailPage.module.css';

const MAX_STARS = 5;

function getStarIcon(position: number, rating: number) {
    if (rating >= position) {
        return FaStar;
    }

    return rating >= position - 0.5 ? FaStarHalfAlt : FaRegStar;
}

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
