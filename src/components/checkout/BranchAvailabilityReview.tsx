/**
 * @fileoverview Productos del resumen de compra con su disponibilidad en la
 * sucursal elegida y las soluciones para los que no tienen unidades
 * suficientes. Se muestra en el resumen lateral durante el paso de entrega.
 */

import { useTranslation } from 'react-i18next';
import { FaCompressAlt, FaStore, FaTrash } from 'react-icons/fa';

import { useBranch } from '../../context/BranchContext';
import { useCart, type CartItem } from '../../context/CartContext';
import type { Branch } from '../../inventory/branches';
import type { BranchSuggestion, CartLineAtBranch } from '../../inventory/cartAvailability';
import { formatCurrency } from '../../utils/formatCurrency';
import type { PurchaseMode } from './checkoutTypes';

import styles from './BranchAvailabilityReview.module.css';

/** Identificador del contenedor, para enfocarlo cuando hay un error. */
export const AVAILABILITY_REVIEW_ID = 'checkout-availability-review';

/** Clase de estilo del estado de cada línea. */
const LINE_STATUS_CLASS: Record<CartLineAtBranch['availability'], string> = {
    ENOUGH: styles.statusEnough,
    PARTIAL: styles.statusPartial,
    NONE: styles.statusNone,
    UNKNOWN: styles.statusNone
};

/** Propiedades de BranchAvailabilityReview. */
interface BranchAvailabilityReviewProps {
    /** Productos del carrito. */
    cart: CartItem[];
    /** Sucursal elegida, o null si todavía no hay una. */
    branch: Branch | null;
    /** Productos con su disponibilidad en la sucursal; vacío si aún no se sabe. */
    lines: CartLineAtBranch[];
    /** Indica si el inventario todavía se está consultando. */
    isLoading: boolean;
    /** Sucursal que mejor cubre el pedido, para sugerirla. */
    suggestion: BranchSuggestion | null;
    /** Si se compra todo el carrito o solo lo disponible. */
    purchaseMode: PurchaseMode;
    onPurchaseModeChange: (mode: PurchaseMode) => void;
    /** Marca la revisión como inválida tras intentar continuar con problemas. */
    hasError: boolean;
}

/**
 * Muestra cada producto con su precio y su estado en la sucursal elegida. Si a
 * alguno le faltan unidades, ofrece ajustar la cantidad, quitarlo, cambiar a
 * la sucursal que mejor cubre el pedido o comprar solo lo disponible y dejar
 * el resto en el carrito.
 *
 * @param props Propiedades del componente.
 * @return La lista de productos con su disponibilidad.
 */
export default function BranchAvailabilityReview({
    cart,
    branch,
    lines,
    isLoading,
    suggestion,
    purchaseMode,
    onPurchaseModeChange,
    hasError
}: BranchAvailabilityReviewProps) {
    const { t } = useTranslation('checkout');
    const { setItemQuantity, removeProduct } = useCart();
    const { selectBranch } = useBranch();

    const isAvailableOnly = purchaseMode === 'AVAILABLE_ONLY';
    const problemLines = lines.filter((line) => line.availability !== 'ENOUGH');
    const hasSomethingToBuy = lines.some((line) => line.availableUnits > 0);
    const canSuggestOtherBranch =
        branch !== null && suggestion !== null && suggestion.branch.id !== branch.id;

    /**
     * Busca la disponibilidad de un producto del carrito.
     *
     * @param itemId Identificador del producto.
     * @return Su línea con la disponibilidad, o undefined si aún no se sabe.
     */
    const findLine = (itemId: string) => lines.find((line) => line.item.id === itemId);

    /**
     * Describe el estado de una línea en la sucursal elegida.
     *
     * @param line Línea del carrito.
     * @param branchName Nombre de la sucursal.
     * @return El texto del estado.
     */
    const describeLine = (line: CartLineAtBranch, branchName: string) => {
        if (line.availability === 'UNKNOWN') {
            return t('availability.line.unknown');
        }

        if (line.availability === 'ENOUGH') {
            return t('availability.line.enough', { count: line.availableUnits, branch: branchName });
        }

        if (isAvailableOnly) {
            return line.availability === 'PARTIAL'
                ? t('availability.line.partialSplit', {
                    count: line.availableUnits,
                    remaining: line.item.quantity - line.availableUnits
                })
                : t('availability.line.noneSplit');
        }

        return line.availability === 'PARTIAL'
            ? t('availability.line.partial', { count: line.availableUnits, branch: branchName })
            : t('availability.line.none', { branch: branchName });
    };

    /**
     * Calcula cuántas unidades del producto entran en la orden.
     *
     * @param item Producto del carrito.
     * @param line Su disponibilidad, si ya se conoce.
     * @return Las unidades que se comprarán.
     */
    const getUnitsToBuy = (item: CartItem, line: CartLineAtBranch | undefined) =>
        isAvailableOnly && line ? Math.min(item.quantity, line.availableUnits) : item.quantity;

    return (
        <div
            id={AVAILABILITY_REVIEW_ID}
            className={hasError ? `${styles.review} ${styles.reviewInvalid}` : styles.review}
            aria-invalid={hasError}
            tabIndex={-1}
        >
            {!branch && <p className={styles.hint}>{t('availability.chooseBranch')}</p>}
            {branch && isLoading && <p className={styles.hint}>{t('availability.loading')}</p>}

            <ul className={styles.lineList}>
                {cart.map((item) => {
                    const line = branch ? findLine(item.id) : undefined;
                    const unitsToBuy = getUnitsToBuy(item, line);
                    const showActions =
                        line !== undefined &&
                        !isAvailableOnly &&
                        (line.availability === 'PARTIAL' || line.availability === 'NONE');

                    return (
                        <li key={item.id} className={styles.line}>
                            <div className={styles.lineImage}>
                                <img src={item.image} alt="" />
                                <span>{item.quantity}</span>
                            </div>

                            <div className={styles.lineInfo}>
                                <p className={styles.lineName}>{item.name}</p>
                                <span className={styles.linePrice}>
                                    {formatCurrency(item.price, item.currency)}
                                </span>

                                {line && branch && (
                                    <span className={`${styles.lineStatus} ${LINE_STATUS_CLASS[line.availability]}`}>
                                        {describeLine(line, branch.name)}
                                    </span>
                                )}

                                {showActions && (
                                    <div className={styles.lineActions}>
                                        {line.availability === 'PARTIAL' && (
                                            <button
                                                type="button"
                                                className={styles.fixButton}
                                                onClick={() => setItemQuantity(item.id, line.availableUnits)}
                                            >
                                                <FaCompressAlt aria-hidden="true" />
                                                {t('availability.actions.adjust', { count: line.availableUnits })}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className={styles.removeButton}
                                            onClick={() => removeProduct(item.id)}
                                        >
                                            <FaTrash aria-hidden="true" />
                                            {t('availability.actions.remove')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <strong className={unitsToBuy === 0 ? styles.lineTotalMuted : styles.lineTotal}>
                                {formatCurrency(item.price * unitsToBuy, item.currency)}
                            </strong>
                        </li>
                    );
                })}
            </ul>

            {branch && problemLines.length > 0 && (
                <div className={styles.solutions}>
                    {canSuggestOtherBranch && suggestion && (
                        <p className={styles.suggestion}>
                            {suggestion.coversWholeCart
                                ? t('availability.suggestion.wholeCart', { branch: suggestion.branch.name })
                                : t('availability.suggestion.best', {
                                    branch: suggestion.branch.name,
                                    covered: suggestion.coveredLines,
                                    total: lines.length
                                })}
                            <button
                                type="button"
                                className={styles.fixButton}
                                onClick={() => selectBranch(suggestion.branch.id)}
                            >
                                <FaStore aria-hidden="true" />
                                {t('availability.suggestion.use', { branch: suggestion.branch.name })}
                            </button>
                        </p>
                    )}

                    {!canSuggestOtherBranch && suggestion && !suggestion.coversWholeCart && (
                        <p className={styles.suggestion}>{t('availability.suggestion.noneCovers')}</p>
                    )}

                    {hasSomethingToBuy && (
                        <label className={styles.splitOption}>
                            <input
                                type="checkbox"
                                checked={isAvailableOnly}
                                onChange={(event) =>
                                    onPurchaseModeChange(event.target.checked ? 'AVAILABLE_ONLY' : 'WHOLE_CART')
                                }
                            />
                            <span>{t('availability.splitOption', { branch: branch.name })}</span>
                        </label>
                    )}
                </div>
            )}

            {hasError && (
                <p className={styles.error} role="alert">
                    {hasSomethingToBuy ? t('availability.error') : t('availability.errorNothingToBuy')}
                </p>
            )}
        </div>
    );
}
