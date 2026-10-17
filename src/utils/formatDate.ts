export function formatDateTime(isoDate: string): string {
    return new Intl.DateTimeFormat('es-CR', {
        dateStyle: 'long',
        timeStyle: 'short'
    }).format(new Date(isoDate));
}
