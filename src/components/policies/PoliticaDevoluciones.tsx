import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function PoliticaDevoluciones({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Política de Devoluciones">
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Plazo para solicitar devoluciones</h2>
        <p className={styles.text}>
          Para solicitar una devolución, los clientes tienen un plazo de 30 días naturales a partir de la fecha de recepción del producto. 
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Condiciones para aprobar una devolución</h2>
        <p className={styles.text}>
          Para aceptar una devolución, el producto debe estar en su estado original, sin signos de uso y con todos los accesorios y empaques incluidos. Además, se requiere presentar el comprobante de compra o factura correspondiente.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Casos en los que no se aceptan devoluciones</h2>
        <p className={styles.text}>
          No se aceptarán devoluciones en los siguientes casos: productos personalizados, productos en oferta o liquidación, productos que hayan sido dañados por el cliente, y productos que no cumplan con las condiciones mencionadas anteriormente.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Procedimiento para gestionar solicitudes</h2>
        <p className={styles.text}>
          Para gestionar una solicitud de devolución, los clientes deben ponerse en contacto con nuestro equipo de atención al cliente a través del correo electrónico <b>support@post.com</b>.
        </p>
      </section>
    </PolicyModal>
  );
}