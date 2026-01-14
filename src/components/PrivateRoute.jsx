// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getUserRole, clearToken } from '../utils/auth';

/**
 * A wrapper component for routes that require authentication and a specific role.
 * @param {object} props
 * @param {string} props.allowedRole - The required role ('ADMIN' or 'USER').
 */
function PrivateRoute({ allowedRole }) {
  const userRole = getUserRole();

  if (!userRole) {
    // Not logged in (no token or expired)
    clearToken();
    return <Navigate to="/login" replace />;
  }

  if (userRole !== allowedRole) {
    // Logged in but wrong role
    // Optionally redirect to a generic unauthorized page or their own dashboard
    const redirectPath = userRole === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Authorized
  return <Outlet />;
}

export default PrivateRoute;