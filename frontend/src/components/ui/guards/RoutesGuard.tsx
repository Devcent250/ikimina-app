import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth.context";

// Route guard for admin-only routes
export function AdminRoute() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (!user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}

// Route guard for role-based routes
export function PermissionRoute({ requiredPermissions }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  const userPermissions = user?.role?.permissions || {};
  const hasRequiredPermission = requiredPermissions.some(([category, action]) => {
    return userPermissions[category] && userPermissions[category].includes(action);
  });
  
  if (!user.isAdmin && !hasRequiredPermission) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}