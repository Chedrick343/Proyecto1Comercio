/**
 * @fileoverview Métricas de uso de la tienda para el panel administrativo.
 */

import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';
import {
    FaCartPlus,
    FaEye,
    FaSearch,
    FaShoppingBag,
    FaTrashAlt
} from 'react-icons/fa';

import { useAnalytics } from '../../context/AnalyticsContext';
import { getSubjectKey } from '../../activity/eventPayloads';
import { useCatalogCategories } from '../../catalog/useCatalogCategories';
import {
    countEventsByType,
    getActivitySubjects,
    getCategoryInterestBreakdown,
    getLatestEvents,
    getMostViewedProducts,
    getPurchaseFunnel,
    getPurchaseJourney,
    getTopSearchTerms,
    RANKING_LIMIT,
    summarizeUsage,
    type UsageTotals
} from '../../activity/usageSummary';
import { getFormatLocale } from '../../i18n/formatLocale';
import { formatCurrency } from '../../utils/formatCurrency';
import CategoryInterestChart from './CategoryInterestChart';
import ClearActivityDialog from './ClearActivityDialog';
import LatestEventsTable from './LatestEventsTable';
import PurchaseFunnel from './PurchaseFunnel';
import PurchaseJourney from './PurchaseJourney';
import RankedBarList, { type RankedBarItem } from './RankedBarList';
import SubjectAvatar from './SubjectAvatar';
import SubjectSelect, { type SubjectOption } from './SubjectSelect';
import { useSubjectLabel } from './useSubjectLabel';

import styles from './UsageDashboard.module.css';

/** Valor del filtro que muestra la actividad de todos los sujetos. */
const ALL_SUBJECTS = 'all';

/**
 * Formatea un conteo según la configuración regional activa.
 *
 * @param value Conteo a formatear.
 * @return El número con separadores de miles.
 */
const formatCount = (value: number): string => value.toLocaleString(getFormatLocale());

/** Propiedades de StatTile. */
interface StatTileProps {
    icon: IconType;
    label: string;
    value: number;
    /** Dato de contexto bajo el valor. */
    detail: string;
}

/**
 * Muestra una métrica principal con su ícono y su valor destacado.
 *
 * @param props Propiedades del componente.
 * @return La tarjeta de la métrica.
 */
function StatTile({ icon: Icon, label, value, detail }: StatTileProps) {
    return (
        <div className={styles.tile}>
            <dt className={styles.tileLabel}>
                {label}
                <span className={styles.tileIcon}>
                    <Icon aria-hidden="true" />
                </span>
            </dt>
            <dd className={styles.tileValue}>{formatCount(value)}</dd>
            <dd className={styles.tileDetail}>{detail}</dd>
        </div>
    );
}

/**
 * Muestra las cuatro métricas que pide el laboratorio.
 *
 * @param props Propiedades del componente.
 * @param props.totals Totales de uso.
 * @return La fila de tarjetas.
 */
function UsageTiles({ totals }: { totals: UsageTotals }) {
    const { t } = useTranslation('admin');

    const salesDetail = totals.sales.length > 0
        ? t('usage.tiles.sales', {
            amount: totals.sales
                .map(({ amount, currency }) => formatCurrency(amount, currency))
                .join(' + ')
        })
        : t('usage.tiles.noSales');

    return (
        <dl className={styles.tiles} aria-label={t('usage.tiles.label')}>
            <StatTile
                icon={FaEye}
                label={t('usage.tiles.productViews')}
                value={totals.productViews}
                detail={t('usage.tiles.viewedProducts', { count: totals.viewedProductCount })}
            />
            <StatTile
                icon={FaSearch}
                label={t('usage.tiles.searches')}
                value={totals.searches}
                detail={t('usage.tiles.searchedTerms', { count: totals.searchedTermCount })}
            />
            <StatTile
                icon={FaCartPlus}
                label={t('usage.tiles.cartUnits')}
                value={totals.cartUnits}
                detail={t('usage.tiles.cartAdditions', { count: totals.cartAdditions })}
            />
            <StatTile
                icon={FaShoppingBag}
                label={t('usage.tiles.purchases')}
                value={totals.purchases}
                detail={salesDetail}
            />
        </dl>
    );
}

/**
 * Muestra las métricas de uso: tarjetas con los totales, el interés por
 * categoría, el embudo de compra, rankings y los últimos eventos. Se pueden
 * filtrar por usuario o invitado, y el administrador puede borrar toda la
 * actividad para empezar una demostración.
 *
 * @return La sección de métricas.
 */
export default function UsageDashboard() {
    const { t } = useTranslation(['admin', 'auth']);
    const { allEvents, clearAllEvents } = useAnalytics();
    const getSubjectLabel = useSubjectLabel();
    const headingId = useId();

    const [selectedSubjectKey, setSelectedSubjectKey] = useState(ALL_SUBJECTS);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

    const subjects = useMemo(() => getActivitySubjects(allEvents), [allEvents]);

    // Falls back to everyone when the selected subject has no events left (e.g. after clearing).
    const activeSubjectKey = subjects.some((subject) => subject.key === selectedSubjectKey)
        ? selectedSubjectKey
        : ALL_SUBJECTS;

    const events = useMemo(
        () => activeSubjectKey === ALL_SUBJECTS
            ? allEvents
            : allEvents.filter((event) => getSubjectKey(event.subject) === activeSubjectKey),
        [allEvents, activeSubjectKey]
    );

    const totals = useMemo(() => summarizeUsage(events), [events]);
    const catalogCategories = useCatalogCategories();
    const categoryInterest = useMemo(
        () => getCategoryInterestBreakdown(events, catalogCategories),
        [events, catalogCategories]
    );
    const loginCount = useMemo(
        () => countEventsByType(events).find(({ type }) => type === 'LOGIN')?.count ?? 0,
        [events]
    );

    const isSingleSubject = activeSubjectKey !== ALL_SUBJECTS;

    // A single person always counts as 0 or 1 in the funnel, so their journey is shown instead.
    const funnelSteps = useMemo(
        () => isSingleSubject ? [] : getPurchaseFunnel(events),
        [events, isSingleSubject]
    );
    const journeySteps = useMemo(
        () => isSingleSubject ? getPurchaseJourney(events) : [],
        [events, isSingleSubject]
    );

    const subjectOptions: SubjectOption[] = [
        { value: ALL_SUBJECTS, label: t('admin:usage.allSubjects'), eventCount: allEvents.length },
        ...subjects.map(({ key, subject, role, eventCount }) => ({
            value: key,
            label: getSubjectLabel(subject, role),
            subject,
            eventCount
        }))
    ];

    const selectedOption = subjectOptions.find((option) => option.value === activeSubjectKey);

    const mostViewedItems: RankedBarItem[] = getMostViewedProducts(events).map(
        ({ product, viewCount }) => ({
            key: product.productId,
            label: (
                <Link
                    to={`/producto/${encodeURIComponent(product.productId)}`}
                    className={styles.productLink}
                >
                    <img src={product.imageUrl} alt="" className={styles.thumbnail} loading="lazy" />
                    <span className={styles.truncate}>{product.title}</span>
                </Link>
            ),
            value: viewCount
        })
    );

    const topSearchItems: RankedBarItem[] = getTopSearchTerms(events).map(({ query, count }) => ({
        key: query,
        label: <span className={styles.truncate}>«{query}»</span>,
        value: count
    }));

    const hiddenSubjectCount = Math.max(subjects.length - RANKING_LIMIT, 0);
    const subjectItems: RankedBarItem[] = [...subjects]
        .sort((first, second) => second.eventCount - first.eventCount)
        .slice(0, RANKING_LIMIT)
        .map(({ key, subject, role, eventCount }) => ({
            key,
            label: (
                <>
                    <SubjectAvatar subject={subject} />
                    <span className={styles.truncate}>{getSubjectLabel(subject, role)}</span>
                </>
            ),
            value: eventCount
        }));

    /** Borra la actividad y cierra la confirmación. */
    const handleClear = () => {
        clearAllEvents();
        setIsClearDialogOpen(false);
    };

    return (
        <section className={styles.dashboard} aria-labelledby={headingId}>
            <div className={styles.toolbar}>
                <div>
                    <h2 id={headingId} className={styles.heading}>{t('admin:usage.title')}</h2>
                    <p className={styles.description}>{t('admin:usage.description')}</p>
                </div>

                <div className={styles.controls}>
                    <SubjectSelect
                        label={t('admin:usage.filterLabel')}
                        options={subjectOptions}
                        value={activeSubjectKey}
                        onChange={setSelectedSubjectKey}
                    />

                    <button
                        type="button"
                        className={styles.clearButton}
                        aria-haspopup="dialog"
                        disabled={allEvents.length === 0}
                        onClick={() => setIsClearDialogOpen(true)}
                    >
                        <FaTrashAlt aria-hidden="true" />
                        {t('admin:usage.clear')}
                    </button>
                </div>
            </div>

            <UsageTiles totals={totals} />

            {events.length === 0 ? (
                <p className={styles.empty}>{t('admin:usage.empty')}</p>
            ) : (
                <>
                    <div className={styles.overview}>
                        <CategoryInterestChart
                            categories={categoryInterest}
                            isSingleSubject={isSingleSubject}
                        />
                        {isSingleSubject ? (
                            <PurchaseJourney
                                subjectName={selectedOption?.label ?? ''}
                                steps={journeySteps}
                                totals={totals}
                            />
                        ) : (
                            <PurchaseFunnel steps={funnelSteps} totals={totals} />
                        )}
                    </div>

                    <div className={styles.rankings}>
                        <RankedBarList
                            title={t('admin:usage.mostViewed.title')}
                            description={t('admin:usage.mostViewed.description')}
                            items={mostViewedItems}
                            emptyMessage={t('admin:usage.mostViewed.empty')}
                        />
                        <RankedBarList
                            title={t('admin:usage.topSearches.title')}
                            description={t('admin:usage.topSearches.description')}
                            items={topSearchItems}
                            emptyMessage={t('admin:usage.topSearches.empty')}
                        />
                        <RankedBarList
                            title={t('admin:usage.subjects.title')}
                            description={t('admin:usage.subjects.description')}
                            items={subjectItems}
                            emptyMessage={t('admin:usage.subjects.empty')}
                            footer={
                                <p className={styles.note}>
                                    {hiddenSubjectCount > 0 && (
                                        <span className={styles.noteLine}>
                                            {t('admin:usage.subjects.more', { count: hiddenSubjectCount })}
                                        </span>
                                    )}
                                    {t('admin:usage.subjects.logins', { count: loginCount })}
                                </p>
                            }
                        />
                    </div>

                    <LatestEventsTable events={getLatestEvents(events)} />
                </>
            )}

            <ClearActivityDialog
                eventCount={allEvents.length}
                isOpen={isClearDialogOpen}
                onClose={() => setIsClearDialogOpen(false)}
                onConfirm={handleClear}
            />
        </section>
    );
}
