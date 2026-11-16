/**
 * @fileoverview Rutas y secciones del panel administrativo.
 */

/** Ruta del panel administrativo, dentro de la cuenta. */
export const ADMIN_PATH = '/cuenta/admin';

/** Parámetro de la URL que indica la sección abierta del panel. */
export const ADMIN_SECTION_PARAM = 'seccion';

/** Sección del panel administrativo. */
export type AdminSection = 'orders' | 'usage';

/** Valor del parámetro de la URL de cada sección, en el orden de las pestañas. */
export const ADMIN_SECTION_SLUGS: Record<AdminSection, string> = {
    orders: 'ordenes',
    usage: 'metricas'
};

/** Sección que se abre si la URL no indica ninguna válida. */
export const DEFAULT_ADMIN_SECTION: AdminSection = 'orders';

/**
 * Obtiene la sección del panel indicada en la URL.
 *
 * @param slug Valor del parámetro "seccion", o null si no está.
 * @return La sección correspondiente, o la predeterminada si no es válida.
 */
export function getAdminSectionFromSlug(slug: string | null): AdminSection {
    const sections = Object.keys(ADMIN_SECTION_SLUGS) as AdminSection[];
    const section = sections.find((candidate) => ADMIN_SECTION_SLUGS[candidate] === slug);

    return section ?? DEFAULT_ADMIN_SECTION;
}
