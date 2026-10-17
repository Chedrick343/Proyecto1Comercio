import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';

import styles from './SandboxScenarioSelector.module.css';

const SCENARIO_OPTIONS: { value: SandboxScenario; label: string }[] = [
    { value: 'APPROVE', label: 'Pago aprobado' },
    { value: 'DECLINE', label: 'Pago rechazado' },
    { value: 'SERVICE_ERROR', label: 'Error del servicio' },
    { value: 'NO_RESPONSE', label: 'Sin respuesta' }
];

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
    return (
        <fieldset className={styles.sandboxPanel} disabled={disabled}>
            <legend className={styles.title}>Modo Sandbox</legend>
            <p className={styles.hint}>
                Elige el resultado que devolverá el servicio de pago simulado.
            </p>

            <div className={styles.optionList}>
                {SCENARIO_OPTIONS.map((option) => (
                    <label
                        key={option.value}
                        className={
                            option.value === selectedScenario
                                ? `${styles.option} ${styles.optionSelected}`
                                : styles.option
                        }
                    >
                        <input
                            type="radio"
                            name="sandbox-scenario"
                            value={option.value}
                            checked={option.value === selectedScenario}
                            onChange={() => onScenarioChange(option.value)}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
