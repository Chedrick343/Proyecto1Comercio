/**
 * @fileoverview Tabla con los eventos registrados más recientes.
 */

import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import type { AnalyticsEvent } from '../../activity/analyticsTypes';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatShortDateTime } from '../../utils/formatDate';
import DashboardPanel from './DashboardPanel';
import { EVENT_TYPE_ICONS } from './eventTypeIcons';
import { useSubjectLabel } from './useSubjectLabel';

import styles from './LatestEventsTable.module.css';

/**
 * Describe en una línea la información que guarda un evento.
 *
 * @param event Evento a describir.
 * @param t Función de traducción con los espacios admin y auth.
 * @return El detalle del evento.
 */
function describeEvent(event: AnalyticsEvent, t: TFunction<['admin', 'auth']>): string {
    switch (event.type) {
        case 'LOGIN':
            return t(`auth:roles.${event.payload.role}`);
        case 'SEARCH':
            return t('admin:usage.details.search', {
                query: event.payload.query,
                count: event.payload.resultCount
            });
        case 'PRODUCT_VIEW':
            return event.payload.title;
        case 'ADD_TO_CART':
            return t('admin:usage.details.addToCart', {
                title: event.payload.title,
                quantity: event.payload.quantity
            });
        case 'CHECKOUT_START':
            return t('admin:usage.details.checkoutStart', {
                count: event.payload.itemCount,
                total: formatCurrency(event.payload.total, event.payload.currency)
            });
        case 'PURCHASE':
            return t('admin:usage.details.purchase', {
                orderNumber: event.payload.orderNumber,
                total: formatCurrency(event.payload.total, event.payload.currency)
            });
    }
}

/** Propiedades de LatestEventsTable. */
interface LatestEventsTableProps {
    /** Eventos a mostrar, del más reciente al más antiguo. */
    events: AnalyticsEvent[];
}

/**
 * Muestra los eventos con su fecha, tipo, usuario y detalle. En pantallas
 * pequeñas la tabla se desplaza horizontalmente.
 *
 * @param props Propiedades del componente.
 * @return El panel con la tabla.
 */
export default function LatestEventsTable({ events }: LatestEventsTableProps) {
    const { t } = useTranslation(['admin', 'auth']);
    const getSubjectLabel = useSubjectLabel();

    return (
        <DashboardPanel title={t('admin:usage.latest.title')}>
            <div
                className={styles.tableWrapper}
                role="region"
                tabIndex={0}
                aria-label={t('admin:usage.latest.title')}
            >
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th scope="col">{t('admin:usage.latest.date')}</th>
                            <th scope="col">{t('admin:usage.latest.event')}</th>
                            <th scope="col">{t('admin:usage.latest.subject')}</th>
                            <th scope="col">{t('admin:usage.latest.detail')}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {events.map((event) => {
                            const EventIcon = EVENT_TYPE_ICONS[event.type];

                            return (
                                <tr key={event.id}>
                                    <td className={styles.date}>
                                        <time dateTime={event.timestamp}>
                                            {formatShortDateTime(event.timestamp)}
                                        </time>
                                    </td>
                                    <td>
                                        <span className={styles.eventType}>
                                            <EventIcon aria-hidden="true" />
                                            {t(`admin:usage.eventTypes.${event.type}`)}
                                        </span>
                                    </td>
                                    <td className={styles.subject}>{getSubjectLabel(event.subject)}</td>
                                    <td className={styles.detail}>{describeEvent(event, t)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </DashboardPanel>
    );
}
