import styles from './footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Enlaces legales">
        <a href="#">Términos y Condiciones</a>
        <a href="#">Política de Devoluciones</a>
        <a href="#">Política de Envíos</a>
        <a href="#">Política de Privacidad</a>
        <a href="#">Preguntas Frecuentes</a>
      </nav>
      <p className={styles.copyright}>
        &copy; {year} POST. Todos los derechos reservados.
      </p>
    </footer>
  );
}