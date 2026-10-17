import { getFormatLocale } from '../i18n/formatLocale';

export function formatDateTime(isoDate: string): string {
    return new Intl.DateTimeFormat(getFormatLocale(), {
        dateStyle: 'long',
        timeStyle: 'short'
    }).format(new Date(isoDate));
}
