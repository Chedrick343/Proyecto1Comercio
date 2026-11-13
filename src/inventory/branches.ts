/**
 * @fileoverview Sucursales de la tienda. Sus identificadores coinciden con el
 * campo locationId del inventario de cada producto.
 */

/** Sucursal física donde se retira o desde donde se envía un pedido. */
export interface Branch {
    /** Identificador; coincide con locationId en el inventario del producto. */
    id: string;
    name: string;
}

/** Sucursales de la tienda, en el orden en que se muestran. */
export const BRANCHES: Branch[] = [
    { id: 'CR-SJ', name: 'San José' },
    { id: 'CR-ALA', name: 'Alajuela' },
    { id: 'CR-CAR', name: 'Cartago' },
    { id: 'CR-LIM', name: 'Limón' }
];

/**
 * Busca una sucursal por su identificador.
 *
 * @param branchId Identificador de la sucursal.
 * @return La sucursal, o undefined si no existe.
 */
export const findBranchById = (branchId: string): Branch | undefined =>
    BRANCHES.find((branch) => branch.id === branchId);
