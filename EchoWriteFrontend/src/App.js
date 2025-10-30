import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';

import NewContentPage from './pages/NewContentPage';
import ContentDetailPage from './pages/ContentDetailPage';
import EditContentPage from './pages/EditContentPage';
import AllContentPage from './pages/AllContentPage';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RouteChangeTracker from './components/common/RouteChangeTracker';
import ManageTemplatesPage from './pages/ManageTemplatesPage';
import AiToolsPage from './pages/AiToolsPage';
import ManagePersonasPage from './pages/ManagePersonasPage';
import CommunityTemplatesPage from './pages/CommunityTemplatesPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import PricingPage from './pages/PricingPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import AdminPanel from './pages/AdminPanel';

const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

function AppContent() {
  return (
    <Router>
      <RouteChangeTracker />
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

            {/* Non-authenticated routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Routes without active subscription */}
            <Route
              path="/pricing"
              element={
                <ProtectedRoute requireActiveSubscription={false}>
                  <PricingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-status"
              element={
                <ProtectedRoute requireActiveSubscription={false}>
                  <PaymentStatusPage />
                </ProtectedRoute>
              }
            />

            {/* Authenticated routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/content/new"
              element={
                <ProtectedRoute>
                  <NewContentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/content/:id"
              element={
                <ProtectedRoute>
                  <ContentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/content/:id/edit"
              element={
                <ProtectedRoute>
                  <EditContentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-content"
              element={
                <ProtectedRoute>
                  <AllContentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-personas"
              element={
                <ProtectedRoute>
                  <ManagePersonasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-tools"
              element={
                <ProtectedRoute>
                  <AiToolsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <ManageTemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community-templates"
              element={
                <ProtectedRoute>
                  <CommunityTemplatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <React.Suspense fallback={<p>Loading page...</p>}>
                    <ProfilePage />
                  </React.Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        {/* ✅ Footer with Jenkins, Haroon, and Umar Buttons */}
        <footer className="bg-gray-800 text-white text-center p-4">
          © {new Date().getFullYear()} EchoWrite. All rights reserved.

          <div className="mt-4 space-x-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() =>
                alert('✅ Jenkins button clicked — deployment successful!')
              }
            >
              Jenkins
            </button>

            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() =>
                alert('✅ Haroon button clicked — feature verified!')
              }
            >
              Haroon
            </button>

            <button
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => alert('✅ Umar button clicked — test complete!')}
            >
              Umar
            </button>
          </div>

          <div className="mt-2 space-x-4 text-xs">
            <Link
              to="/terms-of-service"
              className="text-gray-400 hover:text-white hover:underline"
            >
              Terms of Service
            </Link>
            <span className="text-gray-500">|</span>
            <Link
              to="/privacy-policy"
              className="text-gray-400 hover:text-white hover:underline"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-500">|</span>
            <Link
              to="/refund-policy"
              className="text-gray-400 hover:text-white hover:underline"
            >
              Refund Policy
            </Link>
          </div>
        </footer>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
