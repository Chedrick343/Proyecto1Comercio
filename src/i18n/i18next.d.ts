/**
 * @fileoverview Tipado de i18next: permite que TypeScript valide las claves de
 * traducción contra los recursos en español.
 */

import 'i18next';

import type { DEFAULT_LANGUAGE, resources } from './resources';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common';
        resources: (typeof resources)[typeof DEFAULT_LANGUAGE];
    }
}
