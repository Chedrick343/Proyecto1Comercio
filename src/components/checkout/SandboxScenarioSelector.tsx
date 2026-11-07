/**
 * @fileoverview Selector de los escenarios que reproducen la pasarela de pago
 * y el servicio de órdenes simulados.
 */

import { useTranslation } from 'react-i18next';

import { MAX_PAYMENT_ATTEMPTS } from '../../orders/orderStateMachine';
import type { OrderScenario } from '../../services/orderSandbox/orderSandboxService';
import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';
import type { SandboxScenarios } from './useOrderPayment';

import styles from './SandboxScenarioSelector.module.css';

/** Escenarios de la pasarela de pago, en el orden en que se muestran. */
const PAYMENT_SCENARIOS: SandboxScenario[] = ['APPROVE', 'DECLINE', 'SERVICE_ERROR', 'NO_RESPONSE'];

/** Escenarios del servicio de órdenes, en el orden en que se muestran. */
const ORDER_SCENARIOS: OrderScenario[] = ['NORMAL', 'OUT_OF_STOCK', 'AMOUNT_MISMATCH', 'CONFIRMATION_ERROR'];

/** Propiedades de ScenarioGroup. */
interface ScenarioGroupProps<S extends string> {
    /** Nombre del grupo de opciones del formulario. */
    name: string;
    title: string;
    /** Obtiene el texto de cada escenario. */
    getLabel: (scenario: S) => string;
    scenarios: S[];
    selectedScenario: S;
    onScenarioChange: (scenario: S) => void;
}

/**
 * Muestra un grupo de escenarios como opciones excluyentes.
 *
 * @param props Propiedades del componente.
 * @return El grupo de opciones.
 * @template S
 */
function ScenarioGroup<S extends string>({
    name,
    title,
    getLabel,
    scenarios,
    selectedScenario,
    onScenarioChange
}: ScenarioGroupProps<S>) {
    return (
        <div className={styles.group} role="radiogroup" aria-labelledby={`${name}-title`}>
            <p id={`${name}-title`} className={styles.groupTitle}>{title}</p>

            <div className={styles.optionList}>
                {scenarios.map((scenario) => (
                    <label
                        key={scenario}
                        className={
                            scenario === selectedScenario
                                ? `${styles.option} ${styles.optionSelected}`
                                : styles.option
                        }
                    >
                        <input
                            type="radio"
                            name={name}
                            value={scenario}
                            checked={scenario === selectedScenario}
                            onChange={() => onScenarioChange(scenario)}
                        />
                        {getLabel(scenario)}
                    </label>
                ))}
            </div>
        </div>
    );
}

/** Propiedades de SandboxScenarioSelector. */
interface SandboxScenarioSelectorProps {
    scenarios: SandboxScenarios;
    disabled: boolean;
    onScenariosChange: (scenarios: SandboxScenarios) => void;
}

/**
 * Permite elegir qué responderán la pasarela de pago y el servicio de
 * órdenes simulados, para probar por separado los resultados del pago y los
 * fallos propios de la orden.
 *
 * @param props Propiedades del componente.
 * @return Los grupos de opciones de escenario.
 */
export default function SandboxScenarioSelector({
    scenarios,
    disabled,
    onScenariosChange
}: SandboxScenarioSelectorProps) {
    const { t } = useTranslation('checkout');

    return (
        <fieldset className={styles.sandboxPanel} disabled={disabled}>
            <legend className={styles.title}>{t('sandbox.title')}</legend>
            <p className={styles.hint}>
                {t('sandbox.hint')}
            </p>

            <ScenarioGroup
                name="sandbox-payment-scenario"
                title={t('sandbox.paymentGroup')}
                getLabel={(scenario) => t(`sandbox.scenarios.${scenario}`)}
                scenarios={PAYMENT_SCENARIOS}
                selectedScenario={scenarios.payment}
                onScenarioChange={(payment) => onScenariosChange({ ...scenarios, payment })}
            />

            <ScenarioGroup
                name="sandbox-order-scenario"
                title={t('sandbox.orderGroup')}
                getLabel={(scenario) => t(`sandbox.orderScenarios.${scenario}`)}
                scenarios={ORDER_SCENARIOS}
                selectedScenario={scenarios.order}
                onScenarioChange={(order) => onScenariosChange({ ...scenarios, order })}
            />

            <p className={styles.note}>
                {t('sandbox.attemptsNote', { count: MAX_PAYMENT_ATTEMPTS })}
            </p>
        </fieldset>
    );
}
