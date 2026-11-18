/**
 * @fileoverview Formulario del administrador para modificar los precios, el
 * mínimo B2B y las unidades por sucursal de un producto.
 */

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { getStockByBranch } from '../../inventory/branchInventory';
import { getBusinessMinimum } from '../../pricing/businessMinimum';
import { getBusinessSavingsPercent } from '../../pricing/customerPrice';
import {
    hasEditProblems,
    validateProductEditValues,
    type EditValueProblem,
    type ProductEditProblems,
    type ProductEditValues
} from '../../product/productEditValidation';
import type { EditableField, FieldChange } from '../../services/productChanges/productChangesService';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Product } from '../../utils/Products';

import styles from './ProductEdit.module.css';

/** Propiedades de EditField. */
interface EditFieldProps {
    label: string;
    value: string;
    /** Valor actual ya formateado, por ejemplo "₡25 000". */
    currentText: string;
    /** Nuevo valor formateado; solo si cambió y es válido. */
    newText?: string;
    problem?: EditValueProblem;
    onChange: (value: string) => void;
}

/**
 * Muestra un campo numérico con su valor actual debajo. Si el valor cambió,
 * muestra el anterior y el nuevo; si no es válido, el problema.
 *
 * @param props Propiedades del componente.
 * @return El campo.
 */
function EditField({ label, value, currentText, newText, problem, onChange }: EditFieldProps) {
    const { t } = useTranslation('admin');

    return (
        <label className={styles.field}>
            <span className={styles.fieldLabel}>{label}</span>
            <input
                type="number"
                inputMode="numeric"
                className={problem ? `${styles.input} ${styles.inputInvalid}` : styles.input}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={problem ? true : undefined}
            />
            {problem ? (
                <span className={styles.fieldProblem}>{t(`products.editing.problems.${problem}`)}</span>
            ) : newText ? (
                <span className={styles.fieldChanged}>
                    {t('products.editing.change', { previous: currentText, next: newText })}
                </span>
            ) : (
                <span className={styles.fieldHint}>{t('products.editing.current', { value: currentText })}</span>
            )}
        </label>
    );
}

/** Propiedades de SavingsPreview. */
interface SavingsPreviewProps {
    /** Ahorro con los precios actuales. */
    currentPercent: number;
    /** Ahorro con los precios escritos; null si alguno no es válido. */
    newPercent: number | null;
}

/**
 * Muestra cuánto ahorra una empresa frente al precio B2C. No se edita: se
 * recalcula mientras se cambian los precios, para ver el efecto antes de
 * guardar.
 *
 * @param props Propiedades del componente.
 * @return La tarjeta del ahorro.
 */
function SavingsPreview({ currentPercent, newPercent }: SavingsPreviewProps) {
    const { t } = useTranslation('admin');
    const hasChanged = newPercent !== null && newPercent !== currentPercent;
    const currentText = t('products.editing.savingsValue', { percent: currentPercent });

    return (
        <div className={`${styles.field} ${styles.savingsField}`}>
            <span className={styles.fieldLabel}>{t('products.editing.savingsLabel')}</span>
            <span className={styles.savingsValue}>
                {newPercent === null ? '-' : t('products.editing.savingsValue', { percent: newPercent })}
            </span>
            {hasChanged ? (
                <span className={styles.fieldChanged}>
                    {t('products.editing.change', {
                        previous: currentText,
                        next: t('products.editing.savingsValue', { percent: newPercent })
                    })}
                </span>
            ) : (
                <span className={styles.fieldHint}>{t('products.editing.savingsHint')}</span>
            )}
        </div>
    );
}

/**
 * Obtiene los valores actuales del producto como textos del formulario.
 *
 * @param product Producto a editar.
 * @return Los valores iniciales del formulario.
 */
function getInitialValues(product: Product): ProductEditValues {
    return {
        retailPrice: String(product.b2c.price),
        businessPrice: String(product.b2b.price),
        businessMinimum: String(getBusinessMinimum(product)),
        branchStock: Object.fromEntries(
            getStockByBranch(product).map(({ branch, stock }) => [branch.id, String(stock)])
        )
    };
}

/**
 * Compara los valores escritos con los actuales y arma la lista de cambios.
 *
 * @param product Producto a editar.
 * @param values Valores escritos, ya validados.
 * @return Los datos que cambiaron, con su valor anterior y el nuevo.
 */
function getChanges(product: Product, values: ProductEditValues): FieldChange[] {
    const initialValues = getInitialValues(product);
    const priceFields: Exclude<EditableField, 'branchStock'>[] = ['retailPrice', 'businessPrice', 'businessMinimum'];
    const changes: FieldChange[] = priceFields
        .filter((field) => Number(values[field]) !== Number(initialValues[field]))
        .map((field) => ({
            field,
            previousValue: Number(initialValues[field]),
            newValue: Number(values[field])
        }));

    Object.entries(values.branchStock).forEach(([branchId, value]) => {
        const previousValue = Number(initialValues.branchStock[branchId]);

        if (Number(value) !== previousValue) {
            changes.push({ field: 'branchStock', branchId, previousValue, newValue: Number(value) });
        }
    });

    return changes;
}

/** Propiedades de ProductEditForm. */
interface ProductEditFormProps {
    product: Product;
    /** Indica si los cambios se están enviando a Algolia. */
    isSaving: boolean;
    /** Se llama con los cambios cuando el formulario es válido. */
    onSave: (changes: FieldChange[]) => void;
    onCancel: () => void;
}

/**
 * Muestra el formulario para editar un producto. Cada campo indica su valor
 * actual y, al cambiarlo, el valor anterior y el nuevo. Los problemas se
 * muestran mientras se escribe, y no se puede guardar si hay alguno o si no
 * se cambió nada.
 *
 * @param props Propiedades del componente.
 * @return El formulario.
 */
export default function ProductEditForm({ product, isSaving, onSave, onCancel }: ProductEditFormProps) {
    const { t } = useTranslation('admin');
    const [values, setValues] = useState<ProductEditValues>(() => getInitialValues(product));
    const initialValues = getInitialValues(product);
    const problems: ProductEditProblems = validateProductEditValues(values);
    const isValid = !hasEditProblems(problems);
    const changes = isValid ? getChanges(product, values) : [];
    const currency = product.b2c.currency;

    /**
     * Devuelve el nuevo valor formateado si cambió y es válido.
     *
     * @param value Valor escrito.
     * @param initialValue Valor actual.
     * @param problem Problema del campo, si tiene.
     * @param format Función que da formato al número.
     * @return El texto del nuevo valor, o undefined si no cambió.
     */
    const getNewText = (
        value: string,
        initialValue: string,
        problem: EditValueProblem | undefined,
        format: (amount: number) => string
    ): string | undefined =>
        !problem && value.trim() !== '' && Number(value) !== Number(initialValue) ? format(Number(value)) : undefined;

    const formatPrice = (amount: number) => formatCurrency(amount, currency);
    const formatUnits = (units: number) => t('products.units', { count: units });
    const newSavingsPercent = problems.retailPrice || problems.businessPrice
        ? null
        : getBusinessSavingsPercent({
            ...product,
            b2c: { ...product.b2c, price: Number(values.retailPrice) },
            b2b: { ...product.b2b, price: Number(values.businessPrice) }
        });

    /**
     * Guarda los cambios si el formulario es válido.
     *
     * @param event Evento de envío del formulario.
     */
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isValid || changes.length === 0) {
            console.log('Edición de producto sin guardar: hay valores inválidos o no hay cambios.', problems);
            return;
        }

        onSave(changes);
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <fieldset className={styles.group}>
                <legend className={styles.groupTitle}>{t('products.editing.pricesTitle')}</legend>
                <div className={styles.fields}>
                    <EditField
                        label={t('products.columns.retailPrice')}
                        value={values.retailPrice}
                        currentText={formatPrice(Number(initialValues.retailPrice))}
                        newText={getNewText(values.retailPrice, initialValues.retailPrice, problems.retailPrice, formatPrice)}
                        problem={problems.retailPrice}
                        onChange={(value) => setValues({ ...values, retailPrice: value })}
                    />
                    <EditField
                        label={t('products.columns.businessPrice')}
                        value={values.businessPrice}
                        currentText={formatPrice(Number(initialValues.businessPrice))}
                        newText={getNewText(values.businessPrice, initialValues.businessPrice, problems.businessPrice, formatPrice)}
                        problem={problems.businessPrice}
                        onChange={(value) => setValues({ ...values, businessPrice: value })}
                    />
                    <EditField
                        label={t('products.columns.businessMinimum')}
                        value={values.businessMinimum}
                        currentText={formatUnits(Number(initialValues.businessMinimum))}
                        newText={getNewText(values.businessMinimum, initialValues.businessMinimum, problems.businessMinimum, formatUnits)}
                        problem={problems.businessMinimum}
                        onChange={(value) => setValues({ ...values, businessMinimum: value })}
                    />
                    <SavingsPreview
                        currentPercent={getBusinessSavingsPercent(product)}
                        newPercent={newSavingsPercent}
                    />
                </div>
            </fieldset>

            <fieldset className={styles.group}>
                <legend className={styles.groupTitle}>{t('products.branchStockTitle')}</legend>
                <div className={styles.fields}>
                    {getStockByBranch(product).map(({ branch }) => (
                        <EditField
                            key={branch.id}
                            label={branch.name}
                            value={values.branchStock[branch.id]}
                            currentText={formatUnits(Number(initialValues.branchStock[branch.id]))}
                            newText={getNewText(
                                values.branchStock[branch.id],
                                initialValues.branchStock[branch.id],
                                problems.branchStock[branch.id],
                                formatUnits
                            )}
                            problem={problems.branchStock[branch.id]}
                            onChange={(value) =>
                                setValues({ ...values, branchStock: { ...values.branchStock, [branch.id]: value } })}
                        />
                    ))}
                </div>
            </fieldset>

            <div className={styles.formFooter}>
                <span className={styles.pendingCount}>
                    {isValid
                        ? t('products.editing.pendingChanges', { count: changes.length })
                        : t('products.editing.fixProblems')}
                </span>
                <div className={styles.formActions}>
                    <button type="button" className={styles.secondaryButton} onClick={onCancel}>
                        {t('products.editing.cancel')}
                    </button>
                    <button
                        type="submit"
                        className={styles.primaryButton}
                        disabled={isSaving || !isValid || changes.length === 0}
                    >
                        {isSaving ? t('products.editing.saving') : t('products.editing.save')}
                    </button>
                </div>
            </div>
        </form>
    );
}
