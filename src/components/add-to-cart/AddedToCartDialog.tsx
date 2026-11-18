/**
 * @fileoverview Confirmación que aparece al agregar un producto al carrito.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheck } from 'react-icons/fa';

import type { Product } from '../../utils/Products';
import ActionDialog from '../dialog/ActionDialog';

import dialogStyles from '../dialog/ActionDialog.module.css';
import styles from './AddedToCartDialog.module.css';

/** Propiedades de AddedToCartDialog. */
interface AddedToCartDialogProps {
    /** Producto que se agregó. */
    product: Product;
    /** Indica si el diálogo está abierto. */
    isOpen: boolean;
    /** Se llama cuando el diálogo se cierra. */
    onClose: () => void;
    /** Contenido bajo el producto, como el selector de cantidad. */
    children?: ReactNode;
}

/**
 * Confirma que el producto se agregó y ofrece seguir comprando o ir al
 * carrito. Puede incluir un selector para agregar más unidades sin cerrarla.
 *
 * @param props Propiedades del componente.
 * @return El diálogo de confirmación.
 */
export default function AddedToCartDialog({ product, isOpen, onClose, children }: AddedToCartDialogProps) {
    const { t } = useTranslation(['product', 'common']);

    return (
        <ActionDialog
            isOpen={isOpen}
            onClose={onClose}
            icon={FaCheck}
            eyebrow={t('product:addedDialog.eyebrow')}
            title={t('product:addedDialog.title')}
            actions={
                <>
                    <button type="button" className={dialogStyles.secondaryAction} onClick={onClose}>
                        {t('common:actions.continueShopping')}
                    </button>
                    <Link to="/carrito" className={dialogStyles.primaryAction} onClick={onClose}>
                        {t('product:addedDialog.goToCart')}
                    </Link>
                </>
            }
        >
            <div className={styles.product}>
                <img src={product.image_url} alt="" />
                <p>{product.title}</p>
            </div>

            {children && <div className={styles.quantity}>{children}</div>}
        </ActionDialog>
    );
}
