/**
 * @fileoverview Validación del formato de correos electrónicos.
 */

/** Formato mínimo de un correo: texto, arroba, dominio y extensión. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Indica si un texto tiene formato de correo electrónico.
 *
 * @param email Texto a validar; se ignoran los espacios de los extremos.
 * @return Verdadero si el formato es válido.
 */
export const isValidEmail = (email: string): boolean => EMAIL_PATTERN.test(email.trim());
