import { useCallback, useState } from 'react';
import styles from './footer.module.css';
import TerminosCondiciones from '../policies/TerminosCondiciones';
import PoliticaDevoluciones from '../policies/PoliticaDevoluciones';
import PoliticaEnvios from '../policies/PoliticaEnvios';
import PoliticaPrivacidad from '../policies/PoliticaPrivacidad';
import PreguntasFrecuentes from '../policies/PreguntasFrecuentes';

type PolicyKey = 'terminos' | 'devoluciones' | 'envios' | 'privacidad' | 'faq';

const LINKS: { key: PolicyKey; label: string }[] = [
  { key: 'terminos', label: 'Términos y Condiciones' },
  { key: 'devoluciones', label: 'Política de Devoluciones' },
  { key: 'envios', label: 'Política de Envíos' },
  { key: 'privacidad', label: 'Política de Privacidad' },
  { key: 'faq', label: 'Preguntas Frecuentes' },
];

export default function Footer() {
  const [open, setOpen] = useState<PolicyKey | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const year = new Date().getFullYear();

  return (
    <>
      <footer className={styles.footer}>
        <nav className={styles.links} aria-label="Enlaces legales">
          {LINKS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setOpen(key)}>
              {label}
            </button>
          ))}
        </nav>
        <p className={styles.copyright}>
          &copy; {year} My App. Todos los derechos reservados.
        </p>
      </footer>

      <TerminosCondiciones isOpen={open === 'terminos'} onClose={close} />
      <PoliticaDevoluciones isOpen={open === 'devoluciones'} onClose={close} />
      <PoliticaEnvios isOpen={open === 'envios'} onClose={close} />
      <PoliticaPrivacidad isOpen={open === 'privacidad'} onClose={close} />
      <PreguntasFrecuentes isOpen={open === 'faq'} onClose={close} />
    </>
  );
}