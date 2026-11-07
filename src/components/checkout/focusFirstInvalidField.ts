/**
 * @fileoverview Utilidad de accesibilidad para formularios con errores.
 */

/**
 * Enfoca y centra en pantalla el primer campo marcado como inválido.
 *
 * @param form Formulario donde buscar el campo con aria-invalid="true".
 */
export function focusFirstInvalidField(form: HTMLFormElement) {
    const firstInvalidField = form.querySelector<HTMLElement>('[aria-invalid="true"]');

    if (!firstInvalidField) {
        return;
    }

    firstInvalidField.focus({ preventScroll: true });
    firstInvalidField.scrollIntoView({ block: 'center' });
}
