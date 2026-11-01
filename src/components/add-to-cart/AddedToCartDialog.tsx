/**
 * @fileoverview Confirmación que aparece al agregar un producto al carrito.
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheck } from 'react-icons/fa';

import type { Product } from '../../utils/Products';

import styles from './AddedToCartDialog.module.css';

/** Propiedades de AddedToCartDialog. */
interface AddedToCartDialogProps {
    /** Producto que se agregó. */
    product: Product;
    /** Indica si el diálogo está abierto. */
    isOpen: boolean;
    /** Se llama cuando el diálogo se cierra. */
    onClose: () => void;
}

/**
 * Confirma que el producto se agregó y ofrece seguir comprando o ir al
 * carrito. El <dialog> nativo atrapa el foco y se cierra con Escape; React
 * solo refleja su estado de apertura.
 *
 * @param props Propiedades del componente.
 * @return El diálogo de confirmación.
 */
export default function AddedToCartDialog({ product, isOpen, onClose }: AddedToCartDialogProps) {
    const { t } = useTranslation(['product', 'common']);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (isOpen && !dialog?.open) {
            dialog?.showModal();
        } else if (!isOpen && dialog?.open) {
            dialog.close();
        }
    }, [isOpen]);

    /** Cierra el diálogo; el evento close notifica a onClose. */
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
