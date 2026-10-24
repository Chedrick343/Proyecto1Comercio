import PolicyModal, { type PolicyProps } from './PolicyModal';
import styles from './policies.module.css';

export default function PoliticaPrivacidad({ isOpen, onClose }: PolicyProps) {
  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title="Política de Privacidad">
      <section className={styles.section}>
        <h2 className={styles.subtitle}>Información que recopilamos</h2>
        <p className={styles.text}>
          Recopilamos información personal que nos proporcionas al registrarte, realizar compras o interactuar con nuestro sitio web. Esto puede incluir tu nombre, dirección de correo electrónico, dirección de envío y detalles de pago.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Uso de la información del cliente</h2>
        <p className={styles.text}>
          La información recopilada se utiliza para procesar pedidos, mejorar la experiencia del usuario, enviar actualizaciones sobre productos y promociones, y cumplir con nuestras obligaciones legales. No compartimos tu información personal con terceros sin tu consentimiento, excepto cuando sea necesario para procesar pagos o cumplir con la ley.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Medidas de protección de datos</h2>
        <p className={styles.text}>
          Para proteger tu información personal, implementamos medidas de seguridad técnicas y organizativas, como el cifrado de datos y el acceso restringido a la información. Sin embargo, no podemos garantizar la seguridad absoluta de los datos transmitidos a través de Internet.
        </p>
      </section>
    </PolicyModal>
  );
}