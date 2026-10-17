import type { Product } from '../utils/Products';

type FacetValue = Product['facets'][string];

export type SpecificationGroupId =
    | 'general'
    | 'materials'
    | 'measures'
    | 'chainAndPendant'
    | 'watch'
    | 'other';

export interface SpecificationEntry {
    facetName: string;
    value: FacetValue;
}

export interface SpecificationGroup {
    id: SpecificationGroupId;
    entries: SpecificationEntry[];
}

const FACETS_BY_GROUP: Record<Exclude<SpecificationGroupId, 'other'>, string[]> = {
    general: ['collection', 'style', 'gender', 'type', 'design'],
    materials: ['material', 'color', 'stone'],
    measures: ['length', 'width', 'size', 'diameter'],
    chainAndPendant: ['structure', 'pendant', 'closure'],
    watch: ['movement', 'waterproof']
};

const GROUP_ORDER: SpecificationGroupId[] = [
    'general',
    'materials',
    'measures',
    'chainAndPendant',
    'watch',
    'other'
];

const hasValue = (value: FacetValue | undefined) =>
    value !== undefined && value !== '';

export function groupSpecifications(facets: Product['facets']): SpecificationGroup[] {
    const groupedFacetNames = new Set(Object.values(FACETS_BY_GROUP).flat());

    const entriesFor = (facetNames: string[]): SpecificationEntry[] =>
        facetNames
            .filter((facetName) => hasValue(facets[facetName]))
            .map((facetName) => ({ facetName, value: facets[facetName] }));

    const otherFacetNames = Object.keys(facets).filter(
        (facetName) => !groupedFacetNames.has(facetName)
    );

    return GROUP_ORDER
        .map((id) => ({
            id,
            entries: entriesFor(id === 'other' ? otherFacetNames : FACETS_BY_GROUP[id])
        }))
        .filter((group) => group.entries.length > 0);
}

const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = 'available' | 'lowStock' | 'outOfStock';

export function getStockStatus(product: Product): StockStatus {
    if (!product.in_stock || product.stock_quantity <= 0) {
        return 'outOfStock';
    }

    return product.stock_quantity <= LOW_STOCK_THRESHOLD ? 'lowStock' : 'available';
}

export const getAvailableStores = (product: Product): string[] =>
    product.locations
        .filter((location) => location.available && location.stock > 0)
        .map((location) => location.title);
