import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './footer.module.css';
import PolicyDocument from '../policies/PolicyDocument';
import { POLICY_KEYS, type PolicyKey } from '../policies/policyKeys';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const { t } = useTranslation(['common', 'policies']);
  const [openPolicy, setOpenPolicy] = useState<PolicyKey | null>(null);
  const closePolicy = useCallback(() => setOpenPolicy(null), []);
  const brand = t('common:brand');

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.brandBlock}>
            <p className={styles.brand}>{brand}</p>
            <p className={styles.tagline}>{t('common:footer.tagline')}</p>
          </div>

          <nav className={styles.policiesNav} aria-labelledby="footer-policies-heading">
            <h2 id="footer-policies-heading" className={styles.navTitle}>
              {t('common:footer.policiesTitle')}
            </h2>
            <ul className={styles.links}>
              {POLICY_KEYS.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setOpenPolicy(key)}
                  >
                    {t(`policies:${key}.title`)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className={styles.copyright}>
          {t('common:footer.copyright', { year: CURRENT_YEAR, brand })}
        </p>
      </footer>

      {openPolicy && (
        <PolicyDocument policy={openPolicy} isOpen onClose={closePolicy} />
      )}
    </>
  );
}
