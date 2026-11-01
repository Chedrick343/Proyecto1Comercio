/**
 * @fileoverview Formateo de los nombres y valores de las facetas de un producto.
 */

import { useTranslation } from 'react-i18next';

import type { Product } from '../../utils/Products';

/**
 * Convierte un nombre de faceta en un texto legible.
 *
 * @param facetName Nombre de la faceta (por ejemplo, "water_resistance").
 * @return El nombre con espacios y mayúscula inicial.
 */
const humanizeFacetName = (facetName: string) =>
    facetName
        .replaceAll('_', ' ')
        .replace(/^\w/, (letter) => letter.toUpperCase());

/**
 * Proporciona funciones para mostrar facetas con su nombre traducido.
 *
 * @return getFacetLabel, que traduce el nombre de una faceta (o lo vuelve
 *     legible si no tiene traducción), y formatFacetValue, que muestra los
 *     valores booleanos como "Sí" o "No".
 */
export function useFacetFormatter() {
    const { t } = useTranslation(['product', 'common']);
    const facetLabels: Record<string, string | undefined> = t('product:facets', {
        returnObjects: true
    });

    const getFacetLabel = (facetName: string) =>
        facetLabels[facetName] ?? humanizeFacetName(facetName);

    const formatFacetValue = (value: Product['facets'][string]) =>
        typeof value === 'boolean'
            ? t(value ? 'common:yes' : 'common:no')
            : String(value);

    return { getFacetLabel, formatFacetValue };
}
