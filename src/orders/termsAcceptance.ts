import type { TermsAcceptance } from './orderTypes';

export const CURRENT_TERMS_VERSION = '2026-10';

export function createTermsAcceptance(date: Date = new Date()): TermsAcceptance {
    return {
        acceptedAt: date.toISOString(),
        termsVersion: CURRENT_TERMS_VERSION
    };
}
