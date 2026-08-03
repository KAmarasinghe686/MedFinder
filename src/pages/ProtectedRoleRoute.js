import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoleRoute({ authUser, isAuthChecking = false, allowedRoles, redirectTo = '/login', children }) {
  if (isAuthChecking && !authUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-500">
        Restoring your session...
      </div>
    );
  }

  if (!authUser) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          message: 'Please log in with a registered patient account to order medicine.',
        }}
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(authUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
