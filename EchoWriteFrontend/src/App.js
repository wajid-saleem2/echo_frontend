// // frontend/src/App.js
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import { AuthProvider, useAuth } from './contexts/AuthContext';

// import Navbar from './components/layout/Navbar';
// import HomePage from './pages/HomePage';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import DashboardPage from './pages/DashboardPage';
// import ProtectedRoute from './components/common/ProtectedRoute';
// // Import other pages as you create them
// import NewContentPage from './pages/NewContentPage'; // Add this
// import ContentDetailPage from './pages/ContentDetailPage'; // Add this
// import EditContentPage from './pages/EditContentPage'; // Add this
// import AllContentPage from './pages/AllContentPage'; // <<<< ADD THIS

// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import RouteChangeTracker from './components/common/RouteChangeTracker'; // Import the tracker
// import ManageTemplatesPage from './pages/ManageTemplatesPage';
// import AiToolsPage from './pages/AiToolsPage';
// import ManagePersonasPage from './pages/ManagePersonasPage';
// import CommunityTemplatesPage from './pages/CommunityTemplatesPage';
// import OAuthCallbackPage from './pages/OAuthCallbackPage';
// import PricingPage from './pages/PricingPage';
// import PaymentStatusPage from './pages/PaymentStatusPage';
// import TermsOfServicePage from './pages/TermsOfServicePage';
// import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
// import RefundPolicyPage from './pages/RefundPolicyPage';
// import AdminPanel from './pages/AdminPanel';

// const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

// function App() {
//   const { user } = useAuth();

//   return (
//     <AuthProvider>
//       <Router>
//       <RouteChangeTracker />
//         {/* <div className="flex flex-col min-h-screen"> */}
//         <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
//           <Navbar />
//           <main className="flex-grow container mx-auto px-4 py-8">
//             <Routes>
//               <Route path="/" element={<HomePage />} />
//               <Route path="/login" element={<LoginPage />} />
//               <Route path="/register" element={<RegisterPage />} />

//               {/* Protected Routes */}
//               <Route
//                 path="/dashboard"
//                 element={
//                   <ProtectedRoute>
//                     <DashboardPage />
//                   </ProtectedRoute>
//                 }
//               />
              
//               <Route
//                 path="/content/new"
//                 element={
//                   <ProtectedRoute>
//                     <NewContentPage />
//                   </ProtectedRoute>
//                 }
//               />
//               <Route
//                 path="/content/:id"
//                 element={
//                   <ProtectedRoute>
//                     <ContentDetailPage />
//                   </ProtectedRoute>
//                 }
//               />
//                <Route
//             path="/content/:id/edit" // New route for editing
//             element={
//               <ProtectedRoute>
//                 <EditContentPage />
//               </ProtectedRoute>
//             }
//           />

// <Route
//                 path="/all-content" // <<<< NEW ROUTE
//                 element={
//                   <ProtectedRoute>
//                     <AllContentPage />
//                   </ProtectedRoute>
//                 }
//               />
//               <Route
//                 path="/manage-personas" // <<<< NEW ROUTE
//                 element={
//                   <ProtectedRoute>
//                     <ManagePersonasPage />
//                   </ProtectedRoute>
//                 }
//               />
// <Route path="/ai-tools" element={<ProtectedRoute><AiToolsPage /></ProtectedRoute>} />
// <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

// <Route path="/templates" element={<ProtectedRoute><ManageTemplatesPage /></ProtectedRoute>} />
// <Route path="/community-templates" element={<ProtectedRoute><CommunityTemplatesPage /></ProtectedRoute>} />
// <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
// <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
//     <Route path="/payment-status" element={<ProtectedRoute><PaymentStatusPage /></ProtectedRoute>} />
//     <Route path="/terms-of-service" element={<TermsOfServicePage />} />
//     <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
//     <Route path="/refund-policy" element={<RefundPolicyPage />} />
//            <Route path="/profile" element={<React.Suspense fallback={<p>Loading page...</p>}><ProfilePage /></React.Suspense>} />
             
//             </Routes>
//           </main>
//           <footer className="bg-gray-800 text-white text-center p-4">
//             © {new Date().getFullYear()} EchoWrite. All rights reserved.
//             <div className="mt-2 space-x-4 text-xs">
//         <Link to="/terms-of-service" className="text-gray-400 hover:text-white hover:underline">Terms of Service</Link>
//         <span className="text-gray-500">|</span>
//         <Link to="/privacy-policy" className="text-gray-400 hover:text-white hover:underline">Privacy Policy</Link>
//         <span className="text-gray-500">|</span>
//         <Link to="/refund-policy" className="text-gray-400 hover:text-white hover:underline">Refund Policy</Link>
//     </div>
//           </footer>
//           <ToastContainer
//             position="top-right"
//             autoClose={3000}
//             hideProgressBar={false}
//             newestOnTop={false}
//             closeOnClick
//             rtl={false}
//             pauseOnFocusLoss
//             draggable
//             pauseOnHover
//             theme="colored" // or "light", "dark"
//         />
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute'; // New component for public-only routes

// Import other pages
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
            {/* Public routes - accessible to everyone */}
            <Route path="/" element={<HomePage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

            {/* Auth routes - only for non-authenticated users */}
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

            {/* Protected routes that require authentication only (no active subscription needed) */}
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

            {/* Protected routes that require active subscription */}
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
        <footer className="bg-gray-800 text-white text-center p-4">
          © {new Date().getFullYear()} EchoWrite. All rights reserved.
          <div className="mt-2 space-x-4 text-xs">
            <Link to="/terms-of-service" className="text-gray-400 hover:text-white hover:underline">Terms of Service</Link>
            <span className="text-gray-500">|</span>
            <Link to="/privacy-policy" className="text-gray-400 hover:text-white hover:underline">Privacy Policy</Link>
            <span className="text-gray-500">|</span>
            <Link to="/refund-policy" className="text-gray-400 hover:text-white hover:underline">Refund Policy</Link>
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