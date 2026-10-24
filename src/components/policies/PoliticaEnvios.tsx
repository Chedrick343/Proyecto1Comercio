import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function PoliticaEnvios({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Política de Envíos">
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Cobertura de entrega</h2>
        <p className={styles.text}>
          Hacemos envíos a todo el país, asegurando que tus productos lleguen a la puerta de tu hogar sin importar tu ubicación. Nuestro equipo de logística trabaja para garantizar entregas rápidas y seguras.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Tiempos estimados de envío</h2>
        <p className={styles.text}>
          Los tiempos de envío varían según la ubicación del destinatario y la disponibilidad del producto. En promedio, los pedidos se procesan y envían dentro de 2 a 3 días hábiles, y la entrega puede tardar entre 5 a 7 días hábiles.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Costos de envío</h2>
        <p className={styles.text}>
          El costo de envío será calculado automáticamente durante el proceso de compra, actualmente cobramos el 5% del total de la compra como tarifa de envío.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Restricciones y condiciones especiales</h2>
        <p className={styles.text}>
          No realizamos envíos a zonas de difícil acceso o a direcciones que no sean residenciales. Además, algunos productos pueden tener restricciones de envío debido a su tamaño, peso o naturaleza. Por favor, revisa las condiciones específicas de cada producto antes de realizar tu compra.
        </p>
      </section>
    </PolicyModal>
  );
}