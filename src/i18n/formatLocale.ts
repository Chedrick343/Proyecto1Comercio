import i18n from './index';

const FORMAT_LOCALE_BY_LANGUAGE: Record<string, string> = {
    es: 'es-CR'
};

const FALLBACK_FORMAT_LOCALE = 'es-CR';

export const getFormatLocale = (): string =>
    FORMAT_LOCALE_BY_LANGUAGE[i18n.language] ?? FALLBACK_FORMAT_LOCALE;
