// src/components/ProtectedRoute.jsx
import { useAuth } from "../contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Check:', { isLoading, user: user ? 'User exists' : 'No user', path: location.pathname });

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('[ProtectedRoute] Still loading...');
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (user === null) {
    console.log('[ProtectedRoute] No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  console.log('[ProtectedRoute] User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;
