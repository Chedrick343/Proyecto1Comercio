/**
 * @fileoverview Selector de usuario o invitado para filtrar las métricas, con
 * búsqueda y opciones agrupadas. Usa el selector genérico DropdownSelect.
 */

import { useTranslation } from 'react-i18next';

import type { AnalyticsSubject } from '../../activity/analyticsTypes';
import DropdownSelect, { type DropdownOption } from '../select/DropdownSelect';
import SubjectAvatar from './SubjectAvatar';

/**
 * Cantidad máxima de opciones visibles a la vez. Con más sujetos, la
 * búsqueda es la forma de llegar a los demás.
 */
const MAX_VISIBLE_OPTIONS = 50;

/** Opción del selector. */
export interface SubjectOption {
    value: string;
    label: string;
    /** Usuario o invitado de la opción; no existe en la opción "todos". */
    subject?: AnalyticsSubject;
    eventCount: number;
}

/** Propiedades de SubjectSelect. */
interface SubjectSelectProps {
    /** Etiqueta visible del selector. */
    label: string;
    options: SubjectOption[];
    /** Valor de la opción elegida. */
    value: string;
    onChange: (value: string) => void;
}

/**
 * Muestra un selector con avatar y cantidad de eventos por opción. Las
 * opciones se agrupan en usuarios e invitados y se pueden buscar.
 *
 * @param props Propiedades del componente.
 * @return El selector con su lista desplegable.
 */
export default function SubjectSelect({ label, options, value, onChange }: SubjectSelectProps) {
    const { t } = useTranslation('admin');

    const dropdownOptions: DropdownOption[] = options.map((option) => ({
        value: option.value,
        label: option.label,
        detail: t('usage.eventCount', { count: option.eventCount }),
        group: option.subject ? `${option.subject.type}s` : undefined,
        icon: <SubjectAvatar subject={option.subject} />
    }));

    return (
        <DropdownSelect
            label={label}
            options={dropdownOptions}
            value={value}
            onChange={onChange}
            groupLabels={{
                users: t('usage.subjectSearch.groups.users'),
                guests: t('usage.subjectSearch.groups.guests')
            }}
            search={{
                placeholder: t('usage.subjectSearch.placeholder'),
                label: t('usage.subjectSearch.label'),
                getNoResultsText: (query) => t('usage.subjectSearch.noResults', { query }),
                getMoreResultsText: (shown, total) =>
                    t('usage.subjectSearch.moreResults', { shown, count: total }),
                maxVisibleOptions: MAX_VISIBLE_OPTIONS
            }}
        />
    );
}
