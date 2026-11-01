/**
 * @fileoverview Identificadores de las políticas de la tienda.
 */

/** Identificador de una política; coincide con su clave de traducción. */
export type PolicyKey = 'terms' | 'returns' | 'shipping' | 'privacy' | 'faq';

/** Políticas en el orden en que se listan en el pie de página. */
export const POLICY_KEYS: PolicyKey[] = ['terms', 'returns', 'shipping', 'privacy', 'faq'];
