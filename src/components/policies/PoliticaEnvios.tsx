import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function PoliticaEnvios({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Política de Envíos">
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Cobertura de entrega</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Tiempos estimados de envío</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Costos de envío</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Restricciones y condiciones especiales</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>
    </PolicyModal>
  );
}