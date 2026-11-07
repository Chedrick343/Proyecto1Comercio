/**
 * @fileoverview Relaciona el idioma de la interfaz con la configuración regional de Intl.
 */

import i18n from './index';

/** Configuración regional de Intl que corresponde a cada idioma soportado. */
const FORMAT_LOCALE_BY_LANGUAGE: Record<string, string> = {
    es: 'es-CR'
};

/** Configuración regional usada cuando el idioma activo no tiene una asignada. */
const FALLBACK_FORMAT_LOCALE = 'es-CR';

/**
 * Obtiene la configuración regional para formatear números y fechas.
 *
 * @return Etiqueta BCP 47 correspondiente al idioma activo de i18next.
 */
export const getFormatLocale = (): string =>
    FORMAT_LOCALE_BY_LANGUAGE[i18n.language] ?? FALLBACK_FORMAT_LOCALE;
