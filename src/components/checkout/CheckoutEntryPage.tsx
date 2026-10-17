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
import { IVA_RATE, SHIPPING_RATE, useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRate } from '../../utils/formatRate';
import CheckoutOrderReview from './CheckoutOrderReview';
import PaymentMethodSelection from './PaymentMethodSelection';
import { useOrderPayment } from './useOrderPayment';
import type { SandboxScenario } from '../../services/paymentSandbox/paymentSandboxTypes';
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
    type ShippingDetails,
    type ShippingFieldErrors
} from './checkoutTypes';
import { validateShippingDetails } from './validateShippingDetails';
import { focusFirstInvalidField } from './focusFirstInvalidField';

import styles from './CheckoutEntryPage.module.css';

const hasErrors = (errors: object) => Object.keys(errors).length > 0;

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
    const [sandboxScenario, setSandboxScenario] =
        useState<SandboxScenario>('APPROVE');

    const {
        cart,
        totalItems,
        subtotal,
        iva,
        shipping,
        total
    } = useCart();

    const { t } = useTranslation(['checkout', 'common']);

    const {
        paymentResult,
        isProcessingPayment,
        confirmedOrderNumber,
        payOrder,
        clearPaymentResult,
        discardActiveOrder
    } = useOrderPayment();

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

    const handleShippingSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;

        const validationErrors = validateShippingDetails(shippingDetails);

        if (hasErrors(validationErrors)) {
            flushSync(() => setFieldErrors(validationErrors));
            focusFirstInvalidField(form);
            return;
        }

        setFieldErrors({});
        discardActiveOrder();
        setCurrentStep(2);
    };

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

    const handlePaymentMethodChange = (method: PaymentMethod) => {
        setSelectedPaymentMethod(method);
        setPaymentCardErrors({});
        clearPaymentResult();
    };

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

    const handlePayment = () => payOrder(shippingDetails, sandboxScenario);

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
                                onDetailsChange={handleDetailsChange}
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
                                cart={cart}
                                details={shippingDetails}
                                paymentDescription={
                                    selectedPaymentMethod === 'SAVED_CARD'
                                        ? t('checkout:payment.cardEndingIn', { ...DEFAULT_SAVED_CARD })
                                        : t('checkout:payment.newCardEndingIn', { lastFourDigits: getLastFourDigits(newPaymentCard.cardNumber) })
                                }
                                paymentResult={paymentResult}
                                isProcessingPayment={isProcessingPayment}
                                sandboxScenario={sandboxScenario}
                                onSandboxScenarioChange={setSandboxScenario}
                                onEditDetails={() => setCurrentStep(1)}
                                onEditPayment={() => setCurrentStep(2)}
                                onSubmitPayment={handlePayment}
                            />
                        )}
                    </div>

                    <aside className={styles.summaryColumn}>
                        <section className={styles.summaryPanel} aria-labelledby="summary-heading">
                            <div className={styles.summaryHeading}>
                                <h2 id="summary-heading">{t('common:summary.title')}</h2>
                                <span className={styles.itemCount}>
                                    {t('common:itemCount', { count: totalItems })}
                                </span>
                            </div>

                            <ul className={styles.summaryProductList}>
                                {cart.map((item) => (
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

                            <dl className={styles.summaryRows}>
                                <div>
                                    <dt>{t('common:summary.subtotal')}</dt>
                                    <dd>{formatCurrency(subtotal)}</dd>
                                </div>
                                <div>
                                    <dt>{t('common:summary.iva', { rate: formatRate(IVA_RATE) })}</dt>
                                    <dd>{formatCurrency(iva)}</dd>
                                </div>
                                <div>
                                    <dt>{t('common:summary.shipping', { rate: formatRate(SHIPPING_RATE) })}</dt>
                                    <dd>{formatCurrency(shipping)}</dd>
                                </div>
                            </dl>

                            <div className={styles.totalRow}>
                                <span>{t('common:summary.total')}</span>
                                <strong>{formatCurrency(total)}</strong>
                            </div>
                        </section>

                    </aside>
                </div>
            </section>

            <NavBar />
        </main>
    );
}