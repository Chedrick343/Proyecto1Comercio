import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheck } from 'react-icons/fa';

import type { Product } from '../../utils/Products';

import styles from './AddedToCartDialog.module.css';

interface AddedToCartDialogProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

export default function AddedToCartDialog({ product, isOpen, onClose }: AddedToCartDialogProps) {
    const { t } = useTranslation(['product', 'common']);
    const dialogRef = useRef<HTMLDialogElement>(null);

    // The native <dialog> traps focus and closes with Escape; React only mirrors its open state.
    useEffect(() => {
        const dialog = dialogRef.current;

        if (isOpen && !dialog?.open) {
            dialog?.showModal();
        } else if (!isOpen && dialog?.open) {
            dialog.close();
        }
    }, [isOpen]);

    const closeDialog = () => dialogRef.current?.close();

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-labelledby="added-to-cart-title"
            onClose={onClose}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    closeDialog();
                }
            }}
        >
            <div className={styles.content}>
                <span className={styles.check} aria-hidden="true">
                    <FaCheck />
                </span>

                <p className={styles.eyebrow}>{t('product:addedDialog.eyebrow')}</p>
                <h2 id="added-to-cart-title" className={styles.title}>
                    {t('product:addedDialog.title')}
                </h2>

                <div className={styles.product}>
                    <img src={product.image_url} alt="" />
                    <p>{product.title}</p>
                </div>

                <div className={styles.actions}>
                    <button type="button" className={styles.secondaryAction} onClick={closeDialog}>
                        {t('common:actions.continueShopping')}
                    </button>
                    <Link to="/carrito" className={styles.primaryAction} onClick={closeDialog}>
                        {t('product:addedDialog.goToCart')}
                    </Link>
                </div>
            </div>
        </dialog>
    );
}
