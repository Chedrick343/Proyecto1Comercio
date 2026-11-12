/**
 * @fileoverview Organización de las especificaciones y la disponibilidad de un producto.
 */

import type { Product } from '../utils/Products';

/** Valor de una característica (faceta) del producto. */
type FacetValue = Product['facets'][string];

/** Identificador de un grupo de especificaciones. */
export type SpecificationGroupId =
    | 'general'
    | 'materials'
    | 'measures'
    | 'chainAndPendant'
    | 'watch'
    | 'other';

/** Característica individual dentro de un grupo de especificaciones. */
export interface SpecificationEntry {
    facetName: string;
    value: FacetValue;
}

/** Grupo de características relacionadas que se muestran juntas. */
export interface SpecificationGroup {
    id: SpecificationGroupId;
    entries: SpecificationEntry[];
}

/** Facetas que pertenecen a cada grupo; las demás van al grupo "other". */
const FACETS_BY_GROUP: Record<Exclude<SpecificationGroupId, 'other'>, string[]> = {
    general: ['collection', 'style', 'gender', 'type', 'design'],
    materials: ['material', 'color', 'stone'],
    measures: ['length', 'width', 'size', 'diameter'],
    chainAndPendant: ['structure', 'pendant', 'closure'],
    watch: ['movement', 'waterproof']
};

/** Orden en que se muestran los grupos. */
const GROUP_ORDER: SpecificationGroupId[] = [
    'general',
    'materials',
    'measures',
    'chainAndPendant',
    'watch',
    'other'
];

/**
 * Indica si una faceta tiene un valor que valga la pena mostrar.
 *
 * @param value Valor de la faceta.
 * @return Falso si el valor está ausente o es una cadena vacía.
 */
const hasValue = (value: FacetValue | undefined) =>
    value !== undefined && value !== '';

/**
 * Agrupa las facetas de un producto para mostrarlas como especificaciones.
 *
 * @param facets Facetas del producto.
 * @return Los grupos que tienen al menos una faceta, en el orden de GROUP_ORDER.
 */
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

/** Unidades a partir de las cuales el stock se considera bajo. */
const LOW_STOCK_THRESHOLD = 5;

/** Nivel de disponibilidad de un producto. */
export type StockStatus = 'available' | 'lowStock' | 'outOfStock';

/**
 * Determina el nivel de disponibilidad de una cantidad de unidades, por
 * ejemplo el stock total o el de una sucursal.
 *
 * @param units Unidades disponibles.
 * @return "outOfStock" si no hay unidades, "lowStock" si quedan
 *     LOW_STOCK_THRESHOLD o menos, y "available" en otro caso.
 */
export function getStockStatusForUnits(units: number): StockStatus {
    if (units <= 0) {
        return 'outOfStock';
    }

    return units <= LOW_STOCK_THRESHOLD ? 'lowStock' : 'available';
}

/**
 * Determina el nivel de disponibilidad de un producto.
 *
 * @param product Producto a evaluar.
 * @return El nivel de disponibilidad de su stock total.
 */
export const getStockStatus = (product: Product): StockStatus =>
    product.in_stock ? getStockStatusForUnits(product.stock_quantity) : 'outOfStock';
