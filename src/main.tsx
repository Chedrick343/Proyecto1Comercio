import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App';
import { CartProvider } from './context/CartContext';
import { OrdersProvider } from './context/OrdersContext';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <CartProvider>
                <OrdersProvider>
                    <App />
                </OrdersProvider>
            </CartProvider>
        </BrowserRouter>
    </StrictMode>
);