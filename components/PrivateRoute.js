import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../services/store';

const PrivateRoute = ({ children }) => {
  const { user, token, fetchCurrentUser, isLoading } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUser().finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, [token, user, fetchCurrentUser]);

  if (!token && !user && !initializing) {
    return <Navigate to="/login" replace />;
  }

  if (initializing || isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">Loading...</div>;
  }

  return children;
};

export default PrivateRoute;
