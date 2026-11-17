/**
 * @fileoverview Normalización de textos para búsquedas.
 */

/**
 * Normaliza un texto para buscar sin distinguir mayúsculas ni tildes (por
 * ejemplo, "Joyería" se convierte en "joyeria").
 *
 * @param text Texto a normalizar.
 * @return El texto en minúsculas, sin tildes ni espacios en los extremos.
 */
export const normalizeText = (text: string): string =>
    text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
