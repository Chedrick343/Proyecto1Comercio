/**
 * @fileoverview Textos de los datos que edita el administrador, usados en el
 * resumen de los cambios guardados.
 */

import type { TFunction } from 'i18next';

import { BRANCHES } from '../../inventory/branches';
import type { EditableField } from '../../services/productChanges/productChangesService';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Obtiene el nombre visible de un dato editado.
 *
 * @param field Dato editado.
 * @param branchId Sucursal, para las unidades.
 * @param t Función de traducción del panel.
 * @return Por ejemplo "Precio B2B" o "Unidades en Cartago".
 */
export function getFieldName(field: EditableField, branchId: string | undefined, t: TFunction<'admin'>): string {
    if (field === 'branchStock') {
        const branchName = BRANCHES.find((branch) => branch.id === branchId)?.name ?? branchId;
        return t('products.editing.fields.branchStock', { branch: branchName });
    }

    return t(`products.editing.fields.${field}`);
}

/**
 * Da formato al valor de un dato editado: los precios como moneda y lo demás
 * como unidades.
 *
 * @param field Dato editado.
 * @param value Valor a mostrar.
 * @param currency Moneda de los precios.
 * @param t Función de traducción del panel.
 * @return El valor formateado.
 */
export function formatFieldValue(field: EditableField, value: number, currency: string, t: TFunction<'admin'>): string {
    return field === 'retailPrice' || field === 'businessPrice'
        ? formatCurrency(value, currency)
        : t('products.units', { count: value });
}
