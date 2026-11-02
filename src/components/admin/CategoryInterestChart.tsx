/**
 * @fileoverview Gráfico de barras con el interés en cada categoría: vistas y
 * productos agregados al carrito.
 */

import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

import type { CategoryInterest } from '../../activity/usageSummary';
import DashboardPanel from './DashboardPanel';

import styles from './CategoryInterestChart.module.css';

/**
 * Colores del gráfico. Las dos series se validaron para daltonismo sobre la
 * superficie del panel; cada barra además muestra su valor escrito.
 */
const CHART_COLORS = {
    views: '#a8822e',
    cartAdditions: '#4f94d8',
    grid: '#313134',
    axis: '#8f8e93',
    label: '#c9c7cc',
    cursor: 'rgba(255, 255, 255, 0.04)'
};

/** Alto del gráfico, en píxeles. */
const CHART_HEIGHT_PX = 300;

/** Consulta de medios de las pantallas en las que se inclinan los nombres de las categorías. */
const NARROW_SCREEN_QUERY = '(max-width: 599px)';

/**
 * Se suscribe a los cambios de la consulta de pantallas angostas.
 *
 * @param onChange Función que se llama cuando la consulta cambia.
 * @return La función que cancela la suscripción.
 */
function subscribeToNarrowScreen(onChange: () => void) {
    const query = window.matchMedia(NARROW_SCREEN_QUERY);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
}

/**
 * Indica si la pantalla es angosta.
 *
 * @return Verdadero si coincide con NARROW_SCREEN_QUERY.
 */
const isNarrowScreen = () => window.matchMedia(NARROW_SCREEN_QUERY).matches;

/** Series del gráfico, en el orden de la leyenda. */
const SERIES = ['views', 'cartAdditions'] as const;

/** Propiedades de CategoryTooltip. */
interface CategoryTooltipProps {
    /** Indica si el puntero está sobre una categoría. */
    active?: boolean;
    /** Datos de la categoría activa. */
    payload?: ReadonlyArray<{ payload?: unknown }>;
}

/**
 * Muestra las vistas y los productos agregados al carrito de la categoría
 * bajo el puntero.
 *
 * @param props Propiedades del componente.
 * @return La tarjeta del tooltip, o null si no hay una categoría activa.
 */
function CategoryTooltip({ active, payload }: CategoryTooltipProps) {
    const { t } = useTranslation('admin');
    const interest = payload?.[0]?.payload as CategoryInterest | undefined;

    if (!active || !interest) {
        return null;
    }

    return (
        <div className={styles.tooltip}>
            <p className={styles.tooltipTitle}>{interest.category}</p>
            <ul className={styles.tooltipList}>
                {SERIES.map((series) => (
                    <li key={series}>
                        <span className={styles.swatch} style={{ backgroundColor: CHART_COLORS[series] }} />
                        <span>{t(`usage.categoryInterest.series.${series}`)}</span>
                        <strong>{interest[series]}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Propiedades de CategoryInterestChart. */
interface CategoryInterestChartProps {
    /** Categorías ordenadas de mayor a menor interés. */
    categories: CategoryInterest[];
    /** Indica si se muestra la actividad de una sola persona. */
    isSingleSubject: boolean;
}

/**
 * Compara, para cada categoría, cuántas veces se vieron sus productos y
 * cuántas se agregaron al carrito. Con una sola persona elegida, explica que
 * sus primeras categorías son las que usa la tienda para recomendarle productos.
 *
 * @param props Propiedades del componente.
 * @return El panel con el gráfico.
 */
export default function CategoryInterestChart({
    categories,
    isSingleSubject
}: CategoryInterestChartProps) {
    const { t } = useTranslation('admin');
    const isNarrow = useSyncExternalStore(subscribeToNarrowScreen, isNarrowScreen);

    const legend = (
        <ul className={styles.legend}>
            {SERIES.map((series) => (
                <li key={series}>
                    <span className={styles.swatch} style={{ backgroundColor: CHART_COLORS[series] }} />
                    {t(`usage.categoryInterest.series.${series}`)}
                </li>
            ))}
        </ul>
    );

    return (
        <DashboardPanel
            title={t('usage.categoryInterest.title')}
            description={t(
                isSingleSubject
                    ? 'usage.categoryInterest.descriptionSingle'
                    : 'usage.categoryInterest.description'
            )}
        >
            {categories.length === 0 ? (
                <p className={styles.empty}>{t('usage.categoryInterest.empty')}</p>
            ) : (
                <>
                    {legend}
                    <div
                        className={styles.chart}
                        style={{ height: CHART_HEIGHT_PX }}
                        role="img"
                        aria-label={t('usage.categoryInterest.summary', {
                            list: categories
                                .map(({ category, views, cartAdditions }) =>
                                    t('usage.categoryInterest.summaryItem', { category, views, cartAdditions }))
                                .join('; ')
                        })}
                    >
                        <div className={styles.canvas}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={categories}
                                    margin={{ top: 20, right: 4, bottom: 0, left: -20 }}
                                    barGap={4}
                                    barCategoryGap="24%"
                                >
                                    <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
                                    <XAxis
                                        dataKey="category"
                                        interval={0}
                                        tick={{ fill: CHART_COLORS.label, fontSize: 12 }}
                                        angle={isNarrow ? -35 : 0}
                                        textAnchor={isNarrow ? 'end' : 'middle'}
                                        height={isNarrow ? 56 : 30}
                                        tickLine={false}
                                        axisLine={{ stroke: CHART_COLORS.grid }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => (
                                            <CategoryTooltip active={active} payload={payload} />
                                        )}
                                        cursor={{ fill: CHART_COLORS.cursor }}
                                        isAnimationActive={false}
                                    />
                                    {SERIES.map((series) => (
                                        <Bar
                                            key={series}
                                            dataKey={series}
                                            name={t(`usage.categoryInterest.series.${series}`)}
                                            fill={CHART_COLORS[series]}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={28}
                                            // Zero values keep a sliver of height, so their "0" label is still drawn.
                                            minPointSize={2}
                                        >
                                            <LabelList
                                                dataKey={series}
                                                position="top"
                                                fill={CHART_COLORS.label}
                                                fontSize={11}
                                            />
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </DashboardPanel>
    );
}
