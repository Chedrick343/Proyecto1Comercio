/**
 * @fileoverview Validación de los valores que escribe el administrador al
 * editar un producto.
 */

/** Precio máximo aceptado, para evitar errores de digitación. */
const MAX_PRICE = 100_000_000;

/** Mínimo B2B máximo aceptado. */
const MAX_BUSINESS_MINIMUM = 1000;

/** Unidades máximas aceptadas en una sucursal. */
const MAX_BRANCH_STOCK = 10_000;

/** Problema de un valor escrito por el administrador. */
export type EditValueProblem =
    | 'required'
    | 'notWholeNumber'
    | 'priceNotPositive'
    | 'priceTooHigh'
    | 'businessPriceAboveRetail'
    | 'minimumBelowOne'
    | 'minimumTooHigh'
    | 'stockNegative'
    | 'stockTooHigh';

/** Valores del formulario de edición, tal como se escriben. */
export interface ProductEditValues {
    retailPrice: string;
    businessPrice: string;
    businessMinimum: string;
    /** Unidades escritas para cada sucursal. */
    branchStock: Record<string, string>;
}

/** Problemas encontrados en el formulario, por campo. */
export interface ProductEditProblems {
    retailPrice?: EditValueProblem;
    businessPrice?: EditValueProblem;
    businessMinimum?: EditValueProblem;
    branchStock: Record<string, EditValueProblem>;
}

/**
 * Convierte un texto en un número entero.
 *
 * @param value Texto escrito.
 * @return El número, null si está vacío o "notWholeNumber" si no es entero.
 */
function parseWholeNumber(value: string): number | null | 'notWholeNumber' {
    const trimmedValue = value.trim();

    if (trimmedValue === '') {
        return null;
    }

    const number = Number(trimmedValue);
    return Number.isInteger(number) ? number : 'notWholeNumber';
}

/**
 * Valida un precio.
 *
 * @param value Texto escrito.
 * @return El problema, o undefined si el precio es válido.
 */
function validatePrice(value: string): EditValueProblem | undefined {
    const price = parseWholeNumber(value);

    if (price === null) {
        return 'required';
    }

    if (price === 'notWholeNumber') {
        return 'notWholeNumber';
    }

    if (price <= 0) {
        return 'priceNotPositive';
    }

    return price > MAX_PRICE ? 'priceTooHigh' : undefined;
}

/**
 * Valida el mínimo de compra B2B.
 *
 * @param value Texto escrito.
 * @return El problema, o undefined si el mínimo es válido.
 */
function validateBusinessMinimum(value: string): EditValueProblem | undefined {
    const minimum = parseWholeNumber(value);

    if (minimum === null) {
        return 'required';
    }

    if (minimum === 'notWholeNumber') {
        return 'notWholeNumber';
    }

    if (minimum < 1) {
        return 'minimumBelowOne';
    }

    return minimum > MAX_BUSINESS_MINIMUM ? 'minimumTooHigh' : undefined;
}

/**
 * Valida las unidades de una sucursal.
 *
 * @param value Texto escrito.
 * @return El problema, o undefined si las unidades son válidas.
 */
function validateBranchStock(value: string): EditValueProblem | undefined {
    const stock = parseWholeNumber(value);

    if (stock === null) {
        return 'required';
    }

    if (stock === 'notWholeNumber') {
        return 'notWholeNumber';
    }

    if (stock < 0) {
        return 'stockNegative';
    }

    return stock > MAX_BRANCH_STOCK ? 'stockTooHigh' : undefined;
}

/**
 * Valida todos los valores del formulario. Además de revisar cada campo,
 * impide que el precio B2B quede mayor que el B2C, porque el producto
 * quedaría con un precio inválido para las empresas.
 *
 * @param values Valores escritos.
 * @return Los problemas por campo.
 */
export function validateProductEditValues(values: ProductEditValues): ProductEditProblems {
    const problems: ProductEditProblems = {
        retailPrice: validatePrice(values.retailPrice),
        businessPrice: validatePrice(values.businessPrice),
        businessMinimum: validateBusinessMinimum(values.businessMinimum),
        branchStock: {}
    };

    if (!problems.retailPrice && !problems.businessPrice
        && Number(values.businessPrice) > Number(values.retailPrice)) {
        problems.businessPrice = 'businessPriceAboveRetail';
    }

    Object.entries(values.branchStock).forEach(([branchId, value]) => {
        const problem = validateBranchStock(value);

        if (problem) {
            problems.branchStock[branchId] = problem;
        }
    });

    return problems;
}

/**
 * Indica si el formulario tiene algún problema.
 *
 * @param problems Problemas encontrados.
 * @return Verdadero si hay al menos un campo inválido.
 */
export const hasEditProblems = (problems: ProductEditProblems): boolean =>
    Boolean(problems.retailPrice || problems.businessPrice || problems.businessMinimum)
    || Object.keys(problems.branchStock).length > 0;
