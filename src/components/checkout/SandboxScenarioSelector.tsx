import { useTranslation } from 'react-i18next';
import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';

import styles from './SandboxScenarioSelector.module.css';

const SCENARIOS: SandboxScenario[] = ['APPROVE', 'DECLINE', 'SERVICE_ERROR', 'NO_RESPONSE'];

interface SandboxScenarioSelectorProps {
    selectedScenario: SandboxScenario;
    disabled: boolean;
    onScenarioChange: (scenario: SandboxScenario) => void;
}

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
