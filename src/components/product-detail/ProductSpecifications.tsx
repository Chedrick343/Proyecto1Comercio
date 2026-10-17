import { useTranslation } from 'react-i18next';

import { groupSpecifications } from '../../product/productSpecifications';
import type { Product } from '../../utils/Products';
import { useFacetFormatter } from './useFacetFormatter';

import styles from './ProductDetailPage.module.css';

export default function ProductSpecifications({ facets }: { facets: Product['facets'] }) {
    const { t } = useTranslation('product');
    const { getFacetLabel, formatFacetValue } = useFacetFormatter();
    const groups = groupSpecifications(facets);

    if (groups.length === 0) {
        return null;
    }

    return (
        <section className={styles.detailsSection} aria-labelledby="product-details-heading">
            <h2 id="product-details-heading" className={styles.sectionTitle}>
                {t('details.title')}
            </h2>

            <div className={styles.specGroups}>
                {groups.map((group) => (
                    <section key={group.id} className={styles.specGroup}>
                        <h3>{t(`details.groups.${group.id}`)}</h3>

                        <dl>
                            {group.entries.map(({ facetName, value }) => (
                                <div key={facetName}>
                                    <dt>{getFacetLabel(facetName)}</dt>
                                    <dd>{formatFacetValue(value)}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
            </div>
        </section>
    );
}
