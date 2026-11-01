/**
 * @fileoverview Selector del escenario de la pasarela de pago simulada.
 */

import { useTranslation } from 'react-i18next';
import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';

import styles from './SandboxScenarioSelector.module.css';

/** Escenarios disponibles, en el orden en que se muestran. */
const SCENARIOS: SandboxScenario[] = ['APPROVE', 'DECLINE', 'SERVICE_ERROR', 'NO_RESPONSE'];

/** Propiedades de SandboxScenarioSelector. */
interface SandboxScenarioSelectorProps {
    selectedScenario: SandboxScenario;
    disabled: boolean;
    onScenarioChange: (scenario: SandboxScenario) => void;
}

/**
 * Permite elegir qué respuesta simulará la pasarela, para probar los
 * distintos resultados del pago.
 *
 * @param props Propiedades del componente.
 * @return El grupo de opciones de escenario.
 */
export default function SandboxScenarioSelector({
    selectedScenario,
    disabled,
    onScenarioChange
}: SandboxScenarioSelectorProps) {
    const { t } = useTranslation('checkout');

    return (
        <fieldset className={styles.sandboxPanel} disabled={disabled}>
            <legend className={styles.title}>{t('sandbox.title')}</legend>
            <p className={styles.hint}>
                {t('sandbox.hint')}
            </p>

            <div className={styles.optionList}>
                {SCENARIOS.map((scenario) => (
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
                            name="sandbox-scenario"
                            value={scenario}
                            checked={scenario === selectedScenario}
                            onChange={() => onScenarioChange(scenario)}
                        />
                        {t(`sandbox.scenarios.${scenario}`)}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
