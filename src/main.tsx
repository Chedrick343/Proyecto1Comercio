import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './i18n';
import './index.css';
import App from './App';
import { CartProvider } from './context/CartContext';
import { OrdersProvider } from './context/OrdersContext';
import AppErrorBoundary from './components/error/AppErrorBoundary';
import ScrollToTop from './components/navigation/ScrollToTop';
import CartPreviewProvider from './components/cart-preview/CartPreviewProvider';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AppErrorBoundary>
            <BrowserRouter basename={import.meta.env.BASE_URL}>
                <ScrollToTop />
                <CartProvider>
                    <OrdersProvider>
                        <CartPreviewProvider>
                            <App />
                        </CartPreviewProvider>
                    </OrdersProvider>
                </CartProvider>
            </BrowserRouter>
        </AppErrorBoundary>
    </StrictMode>
);