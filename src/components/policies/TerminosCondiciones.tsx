import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function TerminosCondiciones({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Términos y Condiciones">
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Condiciones de uso del sitio</h2>
        <p className={styles.text}>
          Para utilizar nuestro sitio web, los usuarios deben aceptar y cumplir con estos términos y condiciones. Al acceder a nuestro sitio, aceptas estar sujeto a estas condiciones, así como a nuestra política de privacidad y cualquier otra política aplicable.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Condiciones generales de compra</h2>
        <p className={styles.text}>
          Para realizar una compra en nuestro sitio web, los clientes deben proporcionar información precisa y completa, incluyendo datos de contacto y de pago. Nos reservamos el derecho de cancelar cualquier pedido que consideremos fraudulento o que no cumpla con nuestras políticas.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Responsabilidades del cliente</h2>
        <p className={styles.text}>
          Es responsabilidad del cliente revisar y aceptar los términos y condiciones antes de realizar una compra. Además, los clientes deben asegurarse de que la información proporcionada sea correcta y actualizada, y notificar cualquier cambio en sus datos de contacto o de pago.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Responsabilidades de la tienda</h2>
        <p className={styles.text}>
          Es responsabilidad de la tienda garantizar que los productos ofrecidos cumplan con las descripciones y especificaciones proporcionadas en el sitio web. Además, nos comprometemos a procesar los pedidos de manera eficiente y a brindar soporte al cliente en caso de problemas o consultas relacionadas con las compras.
        </p>
      </section>
    </PolicyModal>
  );
}