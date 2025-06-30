// // frontend/src/components/common/ProtectedRoute.js
// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import Spinner from '../layout/Loader';

// const ProtectedRoute = ({ children, requireSubscription = false }) => {
//     const { user, loading } = useAuth();
//     const location = useLocation();

//     if (loading) {
//         // You can add a loading spinner here
//         return <div className="text-center mt-10"><Spinner />Loading authentication status...</div>;
//     }

//     if (!user) {
//         // Redirect them to the /login page, but save the current location they were
//         // trying to go to when they were redirected. This allows us to send them
//         // along to that page after they login, which is a nicer user experience
//         // than dropping them off on the home page.
//         return <Navigate to="/login" state={{ from: location }} replace />;
//     }

//       // If route requires subscription and user doesn't have an active one
//       if (requireSubscription && user.subscription?.status !== 'active') {
//         // Allow access to /pricing page itself even if subscription is required elsewhere
//         if (location.pathname !== '/pricing' && location.pathname !== '/payment-success' && location.pathname !== '/profile') {
//              console.log("User does not have active subscription, redirecting to pricing. Current status:", user.subscription?.status);
//              return <Navigate to="/pricing" state={{ from: location, message: "Please choose a plan to continue." }} replace />;
//         }
//     }

//     return children;
// };

// export default ProtectedRoute;

// components/common/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requireActiveSubscription = true }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires active subscription and user doesn't have one
  if (requireActiveSubscription && (!user.subscription || !user.subscription.isActive)) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-lg text-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold text-lg mb-2">Subscription Required</h3>
          <p className="mb-4">
            Your account is registered but your subscription is not yet active. 
            {user.subscription?.status === 'pending' 
              ? ' Your payment is being processed and will be activated soon.' 
              : ' Please complete your subscription to access this feature.'}
          </p>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Status:</strong> {user.subscription?.status || 'No active subscription'}
            </p>
            {user.subscription?.plan && (
              <p className="text-sm">
                <strong>Plan:</strong> {user.subscription.plan}
              </p>
            )}
          </div>
        </div>
        
        <div className="space-x-4">
          {!user.subscription || user.subscription.status === 'expired' ? (
            <button
              onClick={() => window.location.href = '/pricing'}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
            >
              Choose a Plan
            </button>
          ) : (
            <div className="text-gray-600">
              <p className="mb-4">Please wait for admin approval or contact support if you have questions.</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Refresh Status
              </button>
            </div>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;