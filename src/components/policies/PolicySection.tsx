/**
 * @fileoverview Sección individual de una política.
 */

import styles from './Policies.module.css';

/** Propiedades de PolicySection. */
interface PolicySectionProps {
  title: string;
  body: string;
  /** Etiqueta corta que se muestra sobre el título; es opcional. */
  tag?: string;
}

/**
 * Muestra una sección de política con su título y contenido.
 *
 * @param props Propiedades del componente.
 * @return La sección renderizada.
 */
export default function PolicySection({ title, body, tag }: PolicySectionProps) {
  return (
    <section className={styles.section}>
      {tag && <span className={styles.tag}>{tag}</span>}
      <h2 className={styles.subtitle}>{title}</h2>
      <p className={styles.text}>{body}</p>
    </section>
  );
}
