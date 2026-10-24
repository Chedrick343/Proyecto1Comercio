import { useTranslation } from 'react-i18next';
import PolicyModal, { type PolicyProps } from './PolicyModal';
import PolicySection from './PolicySection';
import type { PolicyKey } from './policyKeys';

interface PolicyDocumentProps extends PolicyProps {
  policy: PolicyKey;
}

export default function PolicyDocument({ policy, isOpen, onClose }: PolicyDocumentProps) {
  const { t } = useTranslation('policies');
  const sections = t(`${policy}.sections`, { returnObjects: true });

  return (
    <PolicyModal isOpen={isOpen} onClose={onClose} title={t(`${policy}.title`)}>
      {Object.entries(sections).map(([key, section]) => (
        <PolicySection key={key} {...section} />
      ))}
    </PolicyModal>
  );
}
