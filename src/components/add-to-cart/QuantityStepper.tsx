/**
 * @fileoverview Selector de cantidad de un producto en el carrito, con botones
 * para quitar y agregar unidades.
 */

import { useTranslation } from 'react-i18next';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';

import styles from './AddToCartControl.module.css';

/** Propiedades de QuantityStepper. */
interface QuantityStepperProps {
    /** Nombre del producto, para las etiquetas accesibles. */
    name: string;
    /** Cantidad que se muestra. */
    quantity: number;
    /** Indica si quitar una unidad elimina el producto del carrito. */
    removesProduct: boolean;
    /** Indica si se puede agregar otra unidad. */
    canIncrease: boolean;
    onDecrease: () => void;
    onIncrease: () => void;
    /** Clase adicional del contenedor. */
    className?: string;
}

/**
 * Muestra la cantidad entre un botón para quitar una unidad (un basurero si
 * es la última) y otro para agregar una.
 *
 * @param props Propiedades del componente.
 * @return El selector de cantidad.
 */
export default function QuantityStepper({
    name,
    quantity,
    removesProduct,
    canIncrease,
    onDecrease,
    onIncrease,
    className
}: QuantityStepperProps) {
    const { t } = useTranslation('product');

    return (
        <div
            className={className ? `${styles.stepper} ${className}` : styles.stepper}
            role="group"
            aria-label={t('cartControl.label', { name })}
        >
            <button
                type="button"
                className={styles.stepButton}
                onClick={onDecrease}
                aria-label={
                    removesProduct
                        ? t('cartControl.remove', { name })
                        : t('cartControl.decrease', { name })
                }
            >
                {quantity === 1
                    ? <FaTrash aria-hidden="true" />
                    : <FaMinus aria-hidden="true" />}
            </button>

            <span className={styles.quantity} aria-live="polite">
                <strong>{quantity}</strong>{' '}
                <span className={styles.inCartLabel}>{t('cartControl.inCart')}</span>
            </span>

            <button
                type="button"
                className={styles.stepButton}
                onClick={onIncrease}
                disabled={!canIncrease}
                aria-label={t('cartControl.increase', { name })}
            >
                <FaPlus aria-hidden="true" />
            </button>
        </div>
    );
}
