/**
 * @fileoverview Página del checkout: envío, método de pago y revisión de la orden.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FaCheck,
    FaClipboardCheck,
    FaCreditCard,
    FaTruck
} from 'react-icons/fa';
import type { IconType } from 'react-icons';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import { useCartBranchStatuses } from '../branch-picker/useBranchStatuses';
import { useBranch } from '../../context/BranchContext';
import {
    IVA_RATE,
    SHIPPING_RATE,
    calculateCartTotals,
    useCart
} from '../../context/CartContext';
import { useSession } from '../../context/SessionContext';
import {
    findBestBranch,
    getCartLinesAtBranch,
    getPurchasableItems,
    isWholeCartAvailable
} from '../../inventory/cartAvailability';
import BranchAvailabilityReview, { AVAILABILITY_REVIEW_ID } from './BranchAvailabilityReview';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';
import CheckoutOrderReview from './CheckoutOrderReview';
import PaymentMethodSelection from './PaymentMethodSelection';
import { useOrderPayment, type SandboxScenarios } from './useOrderPayment';
import type { TermsAcceptance } from '../../orders/orderTypes';
import { createTermsAcceptance } from '../../orders/termsAcceptance';
import {
    DEFAULT_SAVED_CARD,
    INITIAL_NEW_PAYMENT_CARD,
    getLastFourDigits,
    type NewPaymentCard,
    type PaymentCardErrors,
    type PaymentMethod,
    validatePaymentCard
} from './paymentCard';
import ShippingInformationForm from './ShippingInformationForm';
import {
    INITIAL_SHIPPING_DETAILS,
    savedAddressToShippingDetails,
    type AddressChoice,
    type PurchaseMode,
    type ShippingDetails,
    type ShippingFieldErrors
} from './checkoutTypes';
import { validateShippingDetails } from './validateShippingDetails';
import { focusFirstInvalidField } from './focusFirstInvalidField';
import { useTrackCheckoutStart } from '../../activity/useTrackCheckoutStart';

import styles from './CheckoutEntryPage.module.css';

/**
 * Indica si un objeto de errores de validación contiene algún error.
 *
 * @param errors Errores por campo.
 * @return Verdadero si hay al menos un error.
 */
const hasErrors = (errors: object) => Object.keys(errors).length > 0;

/**
 * Guía la compra en tres pasos: entrega, método de pago y revisión con pago.
 * En la entrega se elige la sucursal y se revisa que tenga unidades
 * suficientes de cada producto; si no, el usuario ajusta el pedido, cambia de
 * sucursal o compra solo lo disponible. Redirige al carrito si está vacío y
 * a la confirmación cuando el pago se aprueba.
 *
 * @return La página del checkout o una redirección.
 */
export default function CheckoutEntryPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [shippingDetails, setShippingDetails] = useState<ShippingDetails>(
        INITIAL_SHIPPING_DETAILS
    );
    const [fieldErrors, setFieldErrors] = useState<ShippingFieldErrors>({});
    const [selectedPaymentMethod, setSelectedPaymentMethod] =
        useState<PaymentMethod>('SAVED_CARD');
    const [newPaymentCard, setNewPaymentCard] = useState<NewPaymentCard>(
        INITIAL_NEW_PAYMENT_CARD
    );
    const [paymentCardErrors, setPaymentCardErrors] = useState<PaymentCardErrors>({});
    const [sandboxScenarios, setSandboxScenarios] = useState<SandboxScenarios>({
        payment: 'APPROVE',
        order: 'NORMAL'
    });
    const [termsAcceptance, setTermsAcceptance] = useState<TermsAcceptance | null>(null);
    const [showTermsError, setShowTermsError] = useState(false);
    const [showBranchError, setShowBranchError] = useState(false);
    const { currentUser } = useSession();
    const savedAddress = currentUser?.savedAddress;
    const [addressChoice, setAddressChoice] = useState<AddressChoice>(
        savedAddress ? 'SAVED_ADDRESS' : 'NEW_ADDRESS'
    );
    const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('WHOLE_CART');
    const [showAvailabilityError, setShowAvailabilityError] = useState(false);

    const { cart, total } = useCart();

    const { t } = useTranslation(['checkout', 'common']);
    const { selectedBranch, selectBranch } = useBranch();
    const { statuses: branchStatuses, inventory } = useCartBranchStatuses(cart);
    // El error desaparece en cuanto el usuario elige una sucursal.
    const isBranchMissing = showBranchError && selectedBranch === null;

    const branchLines = selectedBranch && !inventory.isLoading
        ? getCartLinesAtBranch(cart, inventory.productsById, selectedBranch.id)
        : [];
    const branchSuggestion = inventory.isLoading ? null : findBestBranch(cart, inventory.productsById);

    // Lo que entra en la orden: todo el carrito, o solo lo disponible en la sucursal.
    const orderItems = purchaseMode === 'AVAILABLE_ONLY' ? getPurchasableItems(branchLines) : cart;
    const orderTotals = calculateCartTotals(orderItems);
    const orderUnits = orderItems.reduce((units, item) => units + item.quantity, 0);
    const cartUnits = cart.reduce((units, item) => units + item.quantity, 0);
    const unitsLeftInCart = cartUnits - orderUnits;

    const isAvailabilityValid =
        branchLines.length > 0 &&
        branchLines.every((line) => line.availability !== 'UNKNOWN') &&
        (purchaseMode === 'WHOLE_CART' ? isWholeCartAvailable(branchLines) : orderItems.length > 0);
    // Igual que con la sucursal, el error desaparece cuando el problema se resuelve.
    const hasAvailabilityError = showAvailabilityError && selectedBranch !== null && !isAvailabilityValid;

    // Si la sesión cambió y ya no hay dirección guardada, se usa el formulario.
    const isUsingSavedAddress = addressChoice === 'SAVED_ADDRESS' && savedAddress !== undefined;
    const deliveryDetails: ShippingDetails = isUsingSavedAddress && currentUser
        ? savedAddressToShippingDetails(savedAddress, currentUser.email)
        : shippingDetails;

    const {
        paymentResult,
        processingStage,
        paymentAttempts,
        failedOrder,
        confirmedOrderNumber,
        payOrder,
        clearPaymentResult,
        discardActiveOrder
    } = useOrderPayment();

    useTrackCheckoutStart(cart, total);

    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [currentStep]);

    if (confirmedOrderNumber) {
        return <Navigate to={`/orden/${confirmedOrderNumber}`} replace />;
    }

    if (cart.length === 0) {
        return (
            <Navigate
                to="/carrito"
                replace
                state={{ checkoutBlockedByEmptyCart: true }}
            />
        );
    }

    /**
     * Actualiza un campo de envío y quita su error de validación.
     *
     * @param field Campo modificado.
     * @param value Nuevo valor.
     */
    const handleDetailsChange = (
        field: keyof ShippingDetails,
        value: string
    ) => {
        setShippingDetails((previousDetails) => ({
            ...previousDetails,
            [field]: value
        }));
        setFieldErrors((previousErrors) => {
            const updatedErrors = { ...previousErrors };
            delete updatedErrors[field];
            return updatedErrors;
        });
    };

    /**
     * Cambia entre la dirección guardada y otra dirección. Al volver a la
     * dirección guardada, su sucursal predeterminada pasa a ser la sucursal.
     *
     * @param choice Dirección elegida.
     */
    const handleAddressChoiceChange = (choice: AddressChoice) => {
        console.log(`Dirección de entrega elegida: ${choice}.`);
        setAddressChoice(choice);
        setFieldErrors({});

        if (choice === 'SAVED_ADDRESS' && savedAddress?.defaultBranchId) {
            selectBranch(savedAddress.defaultBranchId);
        }
    };

    /**
     * Cambia entre comprar todo el carrito y comprar solo lo disponible.
     *
     * @param mode Modo de compra elegido.
     */
    const handlePurchaseModeChange = (mode: PurchaseMode) => {
        console.log(`Modo de compra: ${mode}.`);
        setPurchaseMode(mode);
    };

    /**
     * Valida la sucursal, la disponibilidad de los productos en ella y, si se
     * usa otra dirección, sus datos; si todo es correcto, avanza al paso de
     * pago. La dirección guardada no se valida porque viene de la cuenta.
     * Descarta la orden activa porque sus datos pudieron cambiar.
     *
     * @param event Evento de envío del formulario.
     */
    const handleShippingSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;

        const validationErrors = isUsingSavedAddress ? {} : validateShippingDetails(shippingDetails);
        const branchIsMissing = selectedBranch === null;
        const hasAvailabilityProblem = !branchIsMissing && !isAvailabilityValid;

        if (hasErrors(validationErrors) || branchIsMissing || hasAvailabilityProblem) {
            console.log('No se puede continuar con la entrega:', {
                validationErrors,
                branchIsMissing,
                hasAvailabilityProblem,
                branchLines
            });
            flushSync(() => {
                setFieldErrors(validationErrors);
                setShowBranchError(branchIsMissing);
                setShowAvailabilityError(hasAvailabilityProblem);
            });

            // La revisión de disponibilidad está en el resumen, fuera del formulario.
            if (hasErrors(validationErrors) || branchIsMissing) {
                focusFirstInvalidField(form);
            } else {
                document.getElementById(AVAILABILITY_REVIEW_ID)?.focus();
            }
            return;
        }

        console.log(
            `Datos de entrega válidos (${isUsingSavedAddress ? 'dirección guardada' : 'otra dirección'}). ` +
            `Sucursal: ${selectedBranch.name}. Modo de compra: ${purchaseMode}.`,
            { deliveryDetails, orderItems }
        );
        setFieldErrors({});
        setShowBranchError(false);
        setShowAvailabilityError(false);
        discardActiveOrder();
        setCurrentStep(2);
    };

    /**
     * Valida la tarjeta nueva, si se eligió, y avanza al paso de revisión.
     *
     * @param event Evento de envío del formulario.
     */
    const handlePaymentMethodSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (selectedPaymentMethod === 'NEW_CARD') {
            const validationErrors = validatePaymentCard(newPaymentCard);

            if (hasErrors(validationErrors)) {
                flushSync(() => setPaymentCardErrors(validationErrors));
                focusFirstInvalidField(form);
                return;
            }

            setPaymentCardErrors({});
        }

        setCurrentStep(3);
    };

    /**
     * Cambia el método de pago y limpia los errores y el último resultado.
     *
     * @param method Método de pago elegido.
     */
    const handlePaymentMethodChange = (method: PaymentMethod) => {
        setSelectedPaymentMethod(method);
        setPaymentCardErrors({});
        clearPaymentResult();
    };

    /**
     * Actualiza un campo de la tarjeta nueva y quita su error de validación.
     *
     * @param field Campo modificado.
     * @param value Nuevo valor.
     */
    const handlePaymentCardChange = (
        field: keyof NewPaymentCard,
        value: string
    ) => {
        setNewPaymentCard((previousCard) => ({
            ...previousCard,
            [field]: value
        }));
        setPaymentCardErrors((previousErrors) => {
            const updatedErrors = { ...previousErrors };
            delete updatedErrors[field];
            if (field === 'expirationMonth' || field === 'expirationYear') {
                delete updatedErrors.expirationMonth;
            }
            return updatedErrors;
        });
    };

    /**
     * Registra o retira la aceptación de los términos.
     *
     * @param accepted Indica si la casilla quedó marcada.
     */
    const handleTermsAcceptanceChange = (accepted: boolean) => {
        setTermsAcceptance(accepted ? createTermsAcceptance() : null);
        setShowTermsError(false);
    };

    /**
     * Paga la orden si se aceptaron los términos; si no, muestra el error.
     *
     * @param event Evento de envío del formulario.
     */
    const handlePaymentSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;

        if (!termsAcceptance) {
            flushSync(() => setShowTermsError(true));
            focusFirstInvalidField(form);
            return;
        }

        payOrder(deliveryDetails, termsAcceptance, sandboxScenarios, orderItems);
    };

    /** Descarta la orden fallida y vuelve a los escenarios sin fallos para intentar de nuevo. */
    const handleStartNewOrder = () => {
        discardActiveOrder();
        setSandboxScenarios({ payment: 'APPROVE', order: 'NORMAL' });
    };

    const checkoutSteps: {
        number: number;
        labelKey: 'delivery' | 'payment' | 'review';
        icon: IconType;
    }[] = [
        { number: 1, labelKey: 'delivery', icon: FaTruck },
        { number: 2, labelKey: 'payment', icon: FaCreditCard },
        { number: 3, labelKey: 'review', icon: FaClipboardCheck }
    ];

    return (
        <main className="app">
            <div className="top-bar">
                <Header />
            </div>

            <section className={styles.checkoutPage}>
                <header className={styles.pageHeader}>
                    <div className={styles.headerCopy}>
                        <Link to="/carrito" className={styles.backLink}>
                            ← {t('checkout:actions.backToCart')}
                        </Link>
                        <div>
                            <p className={styles.eyebrow}>{t('common:yourPurchase')}</p>
                            <h1>{t('checkout:title')}</h1>
                            <p className={styles.description}>
                                {t('checkout:description')}
                            </p>
                        </div>
                    </div>

                    <div className={styles.paymentBadge}>
                        <FaCreditCard aria-hidden="true" />
                        <span>{t('checkout:onlinePaymentBadge')}</span>
                    </div>
                </header>

                <ol className={styles.checkoutSteps} aria-label={t('checkout:steps.label')}>
                    {checkoutSteps.map((step) => (
                        <li
                            key={step.number}
                            aria-current={currentStep === step.number ? 'step' : undefined}
                            className={
                                currentStep === step.number
                                    ? styles.currentStep
                                    : currentStep > step.number
                                        ? styles.completedStep
                                        : undefined
                            }
                        >
                            <span
                                className={
                                    currentStep >= step.number
                                        ? `${styles.stepMarker} ${styles.stepMarkerActive}`
                                        : styles.stepMarker
                                }
                            >
                                {currentStep > step.number ? (
                                    <FaCheck aria-hidden="true" />
                                ) : (
                                    <step.icon aria-hidden="true" />
                                )}
                            </span>
                            <span className={styles.stepLabel}>{t(`checkout:steps.${step.labelKey}`)}</span>
                            {step.number < checkoutSteps.length && (
                                <span
                                    className={
                                        currentStep > step.number
                                            ? `${styles.stepConnector} ${styles.stepConnectorActive}`
                                            : styles.stepConnector
                                    }
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    ))}
                </ol>

                <div className={styles.checkoutLayout}>
                    <div className={styles.mainColumn}>
                        {currentStep === 1 ? (
                            <ShippingInformationForm
                                details={shippingDetails}
                                errors={fieldErrors}
                                savedAddress={savedAddress}
                                addressChoice={isUsingSavedAddress ? 'SAVED_ADDRESS' : 'NEW_ADDRESS'}
                                branchStatuses={branchStatuses}
                                isBranchMissing={isBranchMissing}
                                onDetailsChange={handleDetailsChange}
                                onAddressChoiceChange={handleAddressChoiceChange}
                                onSubmit={handleShippingSubmit}
                            />
                        ) : currentStep === 2 ? (
                            <PaymentMethodSelection
                                selectedMethod={selectedPaymentMethod}
                                savedCard={DEFAULT_SAVED_CARD}
                                newCard={newPaymentCard}
                                errors={paymentCardErrors}
                                onMethodChange={handlePaymentMethodChange}
                                onCardChange={handlePaymentCardChange}
                                onBack={() => setCurrentStep(1)}
                                onContinue={handlePaymentMethodSubmit}
                            />
                        ) : (
                            <CheckoutOrderReview
                                cart={orderItems}
                                details={deliveryDetails}
                                paymentDescription={
                                    selectedPaymentMethod === 'SAVED_CARD'
                                        ? t('checkout:payment.cardEndingIn', { ...DEFAULT_SAVED_CARD })
                                        : t('checkout:payment.newCardEndingIn', { lastFourDigits: getLastFourDigits(newPaymentCard.cardNumber) })
                                }
                                paymentResult={paymentResult}
                                processingStage={processingStage}
                                paymentAttempts={paymentAttempts}
                                failedOrder={failedOrder}
                                sandboxScenarios={sandboxScenarios}
                                hasAcceptedTerms={termsAcceptance !== null}
                                showTermsError={showTermsError}
                                onSandboxScenariosChange={setSandboxScenarios}
                                onTermsAcceptanceChange={handleTermsAcceptanceChange}
                                onEditDetails={() => setCurrentStep(1)}
                                onEditPayment={() => setCurrentStep(2)}
                                onSubmitPayment={handlePaymentSubmit}
                                onDismissPaymentResult={clearPaymentResult}
                                onStartNewOrder={handleStartNewOrder}
                            />
                        )}
                    </div>

                    <aside className={styles.summaryColumn}>
                        <section className={styles.summaryPanel} aria-labelledby="summary-heading">
                            <div className={styles.summaryHeading}>
                                <h2 id="summary-heading">{t('common:summary.title')}</h2>
                                <span className={styles.itemCount}>
                                    {t('common:itemCount', { count: orderUnits })}
                                </span>
                            </div>

                            {currentStep === 1 ? (
                                <BranchAvailabilityReview
                                    cart={cart}
                                    branch={selectedBranch}
                                    lines={branchLines}
                                    isLoading={inventory.isLoading}
                                    suggestion={branchSuggestion}
                                    purchaseMode={purchaseMode}
                                    onPurchaseModeChange={handlePurchaseModeChange}
                                    hasError={hasAvailabilityError}
                                />
                            ) : (
                                <ul className={styles.summaryProductList}>
                                    {orderItems.map((item) => (
                                        <li key={item.id} className={styles.summaryProduct}>
                                            <div className={styles.summaryProductImage}>
                                                <img src={item.image} alt="" />
                                                <span>{item.quantity}</span>
                                            </div>
                                            <div className={styles.summaryProductInfo}>
                                                <p>{item.name}</p>
                                                <span>{formatCurrency(item.price, item.currency)}</span>
                                            </div>
                                            <strong>
                                                {formatCurrency(item.price * item.quantity, item.currency)}
                                            </strong>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {unitsLeftInCart > 0 && (
                                <p className={styles.leftInCartNote}>
                                    {t('checkout:availability.leftInCart', { count: unitsLeftInCart })}
                                </p>
                            )}

                            <dl className={styles.summaryRows}>
                                <div>
                                    <dt>{t('common:branch.shortLabel')}</dt>
                                    <dd>{selectedBranch?.name ?? t('common:branch.notSelected')}</dd>
                                </div>
                                <div>
                                    <dt>{t('common:summary.subtotal')}</dt>
                                    <dd>{formatCurrency(orderTotals.subtotal)}</dd>
                                </div>
                                <div>
                                    <dt>{t('common:summary.iva', { rate: formatRate(IVA_RATE) })}</dt>
                                    <dd>{formatCurrency(orderTotals.iva)}</dd>
                                </div>
                                <div>
                                    <dt>{t('common:summary.shipping', { rate: formatRate(SHIPPING_RATE) })}</dt>
                                    <dd>{formatCurrency(orderTotals.shipping)}</dd>
                                </div>
                            </dl>

                            <div className={styles.totalRow}>
                                <span>{t('common:summary.total')}</span>
                                <strong>{formatCurrency(orderTotals.total)}</strong>
                            </div>
                        </section>

                    </aside>
                </div>
            </section>

            <NavBar />
        </main>
    );
}