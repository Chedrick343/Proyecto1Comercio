import styles from './Policies.module.css';

interface PolicySectionProps {
  title: string;
  body: string;
  tag?: string;
}

export default function PolicySection({ title, body, tag }: PolicySectionProps) {
  return (
    <section className={styles.section}>
      {tag && <span className={styles.tag}>{tag}</span>}
      <h2 className={styles.subtitle}>{title}</h2>
      <p className={styles.text}>{body}</p>
    </section>
  );
}
