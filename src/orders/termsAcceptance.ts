/**
 * @fileoverview Registro de la aceptación de términos y condiciones en una orden.
 */

import type { TermsAcceptance } from './orderTypes';

/** Versión vigente de los términos y condiciones (año-mes de publicación). */
export const CURRENT_TERMS_VERSION = '2026-10';

/**
 * Crea la constancia de que el cliente aceptó los términos vigentes.
 *
 * @param date Momento de la aceptación; por defecto, el momento actual.
 * @return La fecha de aceptación en ISO 8601 junto con la versión aceptada.
 */
export function createTermsAcceptance(date: Date = new Date()): TermsAcceptance {
    return {
        acceptedAt: date.toISOString(),
        termsVersion: CURRENT_TERMS_VERSION
    };
}
