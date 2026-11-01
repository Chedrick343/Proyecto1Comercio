/**
 * @fileoverview Formateo de tasas (impuestos, envío) como porcentajes legibles.
 */

/**
 * Convierte una tasa decimal en un porcentaje entero.
 *
 * @param rate Tasa expresada como fracción (por ejemplo, 0.13).
 * @return El porcentaje redondeado con su símbolo (por ejemplo, "13%").
 */
export const formatRate = (rate: number): string => `${Math.round(rate * 100)}%`;
