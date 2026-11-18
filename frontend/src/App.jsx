import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import HomePage from './pages/home/HomePage';
import RoomsPage from './pages/rooms/RoomsPage';
import RoomDetailsPage from './pages/room-details/RoomDetailsPage';
import AboutPage from './pages/about/AboutPage';
import ContactPage from './pages/contact/ContactPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AccountPage from './pages/account/AccountPage';
import BookingPage from './pages/booking/BookingPage';
import BookingConfirmationPage from './pages/booking/BookingConfirmationPage';
import PaymentPage from './pages/booking/PaymentPage';

function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/rooms/:id" element={<RoomDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/account" element={<ProtectedRoute allowedRoles={['customer']}><AccountPage /></ProtectedRoute>} />
        <Route path="/booking" element={<ProtectedRoute allowedRoles={['customer']}><BookingPage /></ProtectedRoute>} />
        <Route path="/booking/payment" element={<ProtectedRoute allowedRoles={['customer']}><PaymentPage /></ProtectedRoute>} />
        <Route path="/booking/confirmation/:reference" element={<BookingConfirmationPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}

export default App;
