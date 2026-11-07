/**
 * @fileoverview Ventana modal accesible para mostrar políticas.
 */

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import styles from './Policies.module.css';

/** Propiedades comunes de los modales de políticas. */
export interface PolicyProps {
  /** Indica si el modal está abierto. */
  isOpen: boolean;
  /** Se llama cuando el usuario cierra el modal. */
  onClose: () => void;
}

/** Propiedades de PolicyModal. */
interface PolicyModalProps extends PolicyProps {
  title: string;
  children: ReactNode;
}

/**
 * Muestra un modal sobre la página. Mientras está abierto bloquea el
 * desplazamiento del fondo, se cierra con Escape o al hacer clic fuera, y al
 * cerrarse devuelve el foco al elemento que lo abrió.
 *
 * @param props Propiedades del componente.
 * @return El modal en un portal sobre document.body, o null si está cerrado.
 */
export default function PolicyModal({ isOpen, onClose, title, children }: PolicyModalProps) {
  const { t } = useTranslation(['policies', 'common']);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const openerElement = document.activeElement as HTMLElement | null;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
      openerElement?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{t('policies:modal.eyebrow', { brand: t('common:brand') })}</p>
            <h1 id={titleId} className={styles.title}>{title}</h1>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={t('policies:modal.close')}
          >
            <FaTimes aria-hidden="true" />
          </button>
        </header>

        <div className={styles.content}>{children}</div>

        <footer className={styles.actions}>
          <button type="button" className={styles.primaryAction} onClick={onClose}>
            {t('policies:modal.understood')}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
