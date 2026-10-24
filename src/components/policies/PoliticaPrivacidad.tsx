import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function PoliticaPrivacidad({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Política de Privacidad">
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Información que recopilamos</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Uso de la información del cliente</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Medidas de protección de datos</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>
    </PolicyModal>
  );
}