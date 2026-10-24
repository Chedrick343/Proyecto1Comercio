import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function PreguntasFrecuentes({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Preguntas Frecuentes">
      <section className={styles.section}>
        <span className={styles.tag}>Compras</span>
        <h2 className={styles.subtitle}>¿Cómo realizo una compra?</h2>
        <p className={styles.text}>
          Para realizar una compra, primero debes seleccionar el producto que deseas adquirir y agregarlo a tu carrito de compras. Luego, dirígete al carrito y sigue los pasos para completar la compra, proporcionando la información de envío y pago necesaria.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.tag}>Pagos</span>
        <h2 className={styles.subtitle}>¿Qué métodos de pago aceptan?</h2>
        <p className={styles.text}>
          Actualmente aceptamos tarjetas de crédito y débito. Estamos trabajando para agregar más opciones de pago en el futuro.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.tag}>Envíos</span>
        <h2 className={styles.subtitle}>¿Cuánto tarda en llegar mi pedido?</h2>
        <p className={styles.text}>
          En promedio, tu pedido llegará en 5 a 7 días hábiles después de ser procesado.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.tag}>Devoluciones</span>
        <h2 className={styles.subtitle}>¿Puedo devolver un producto?</h2>
        <p className={styles.text}>
          Sí, puedes devolver un producto dentro de los 30 días posteriores a la compra, siempre que esté en las mismas condiciones en que fue entregado.
        </p>
      </section>

      <section className={styles.section}>
        <span className={styles.tag}>Atención al cliente</span>
        <h2 className={styles.subtitle}>¿Cómo me comunico con la tienda?</h2>
        <p className={styles.text}>
          Puedes contactarnos a través de nuestro correo electrónico <b>example@post.cr</b> o llamando al número de atención al cliente <b>+506 1234-5678</b>. Nuestro horario de atención es de lunes a viernes, de 9:00 a.m. a 6:00 p.m.
        </p>
      </section>
    </PolicyModal>
  );
}