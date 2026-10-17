import { useTranslation } from 'react-i18next';

import type { Product } from '../../utils/Products';

const humanizeFacetName = (facetName: string) =>
    facetName
        .replaceAll('_', ' ')
        .replace(/^\w/, (letter) => letter.toUpperCase());

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
