import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Menu from './Menu'
import Order from './Order'
import NotFound from './404'
import Login from './Login'
import OrderMenu from './OrderMenu'
import CartSummary from './CartSummary'
import OrderConfirmation from './OrderConfirmation'
import Payment from './Payment'
import { CartProvider } from '../contexts/CartContext'
import { AuthProvider } from '../contexts/AuthContext'
import FeedbackPage from './Feedback'
import Profile from './Profile'
import Settings from './Settings'
import ManagerSettings from './ManagerSettings'
import StaffOrders from './StaffOrders'
import ProtectedRoute from "../components/ProtectedRoute"

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/order" element={
                <ProtectedRoute>
                  <Order />
                </ProtectedRoute>
              } />
              <Route path="/order/menu" element={
                <ProtectedRoute>
                  <OrderMenu />
                </ProtectedRoute>
              } />
              <Route path="/order/cart" element={
                <ProtectedRoute>
                  <CartSummary />
                </ProtectedRoute>
              } />
              <Route path="/order/confirmation/:order_id" element={
                <ProtectedRoute>
                  <OrderConfirmation />
                </ProtectedRoute>
              } />
              <Route path="/order/payment/:order_id" element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } />
              <Route path="/feedback" element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <ManagerSettings />
                </ProtectedRoute>
              } />
              <Route path="/staff/orders" element={
                <ProtectedRoute>
                  <StaffOrders />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  );
} else {
  console.error('Root element not found');
}
