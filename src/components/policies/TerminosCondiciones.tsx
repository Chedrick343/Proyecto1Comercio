import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function TerminosCondiciones({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Términos y Condiciones">
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Condiciones de uso del sitio</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Condiciones generales de compra</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Responsabilidades del cliente</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Responsabilidades de la tienda</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </section>
    </PolicyModal>
  );
}