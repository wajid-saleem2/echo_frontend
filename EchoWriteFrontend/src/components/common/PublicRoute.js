// components/common/PublicRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate page
  if (user) {
    // If user has active subscription, redirect to dashboard
    if (user.subscription && user.subscription.isActive) {
      return <Navigate to="/dashboard" replace />;
    }
    // If user doesn't have active subscription, redirect to pricing
    // return <Navigate to="/pricing" replace />;
  }

  // If user is not authenticated, show the public route
  return children;
};

export default PublicRoute;