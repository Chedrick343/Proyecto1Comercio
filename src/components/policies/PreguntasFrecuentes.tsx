import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function PreguntasFrecuentes({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Preguntas Frecuentes">
      <section className={styles.section}>
        <span className={styles.tag}>Compras</span>
        <h2 className={styles.subtitle}>¿Cómo realizo una compra?</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.tag}>Pagos</span>
        <h2 className={styles.subtitle}>¿Qué métodos de pago aceptan?</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.tag}>Envíos</span>
        <h2 className={styles.subtitle}>¿Cuánto tarda en llegar mi pedido?</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.tag}>Devoluciones</span>
        <h2 className={styles.subtitle}>¿Puedo devolver un producto?</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.tag}>Atención al cliente</span>
        <h2 className={styles.subtitle}>¿Cómo me comunico con la tienda?</h2>
        <p className={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
      </section>
    </PolicyModal>
  );
}