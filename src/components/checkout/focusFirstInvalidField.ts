export function focusFirstInvalidField(form: HTMLFormElement) {
    const firstInvalidField = form.querySelector<HTMLElement>('[aria-invalid="true"]');

    if (!firstInvalidField) {
        return;
    }

    firstInvalidField.focus({ preventScroll: true });
    firstInvalidField.scrollIntoView({ block: 'center' });
}
