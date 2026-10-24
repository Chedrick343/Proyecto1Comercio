import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import styles from './Policies.module.css';

export interface PolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PolicyModalProps extends PolicyProps {
  title: string;
  children: ReactNode;
}

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
