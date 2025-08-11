import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth.context";

// Route guard for group access - only admins and group leaders can access
export function GroupAccessGuard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin can access all groups
  if (user.isAdmin) {
    return <Outlet />;
  }
  
  // Group leaders (president, accountant, secretary) can access their groups
  if (user.role?.name === "President" || 
      user.role?.name === "Accountant" || 
      user.role?.name === "Secretary") {
    return <Outlet />;
  }
  
  // Regular members should be redirected to dashboard
  return <Navigate to="/dashboard" replace />;
}

// Route guard for admin-only group operations (create, delete)
export function AdminGroupGuard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}

// Route guard for member access - admins and group leaders can access
export function MemberAccessGuard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin can access all members
  if (user.isAdmin) {
    return <Outlet />;
  }
  
  // Group leaders (president, accountant, secretary) can access members
  if (user.role?.name === "President" || 
      user.role?.name === "Accountant" || 
      user.role?.name === "Secretary") {
    return <Outlet />;
  }
  
  // Regular members should be redirected to dashboard
  return <Navigate to="/dashboard" replace />;
}

// Route guard for contribution access - admins and group leaders can access
export function ContributionAccessGuard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin can access all contributions
  if (user.isAdmin) {
    return <Outlet />;
  }
  
  // Group leaders (president, accountant, secretary) can access contributions
  if (user.role?.name === "President" || 
      user.role?.name === "Accountant" || 
      user.role?.name === "Secretary") {
    return <Outlet />;
  }
  
  // Regular members should be redirected to dashboard
  return <Navigate to="/dashboard" replace />;
}

// Route guard for loan access - admins and group leaders can access
export function LoanAccessGuard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin can access all loans
  if (user.isAdmin) {
    return <Outlet />;
  }
  
  // Group leaders (president, accountant, secretary) can access loans
  if (user.role?.name === "President" || 
      user.role?.name === "Accountant" || 
      user.role?.name === "Secretary") {
    return <Outlet />;
  }
  
  // Regular members should be redirected to dashboard
  return <Navigate to="/dashboard" replace />;
}

// Route guard for fine access - admins and group leaders can access
export function FineAccessGuard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin can access all fines
  if (user.isAdmin) {
    return <Outlet />;
  }
  
  // Group leaders (president, accountant, secretary) can access fines
  if (user.role?.name === "President" || 
      user.role?.name === "Accountant" || 
      user.role?.name === "Secretary") {
    return <Outlet />;
  }
  
  // Regular members should be redirected to dashboard
  return <Navigate to="/dashboard" replace />;
}

// Route guard for expense access - admins and group leaders can access
export function ExpenseAccessGuard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin can access all expenses
  if (user.isAdmin) {
    return <Outlet />;
  }
  
  // Group leaders (president, accountant, secretary) can access expenses
  if (user.role?.name === "President" || 
      user.role?.name === "Accountant" || 
      user.role?.name === "Secretary") {
    return <Outlet />;
  }
  
  // Regular members should be redirected to dashboard
  return <Navigate to="/dashboard" replace />;
}

// Route guard for attendance access - admins and group leaders can access
export function AttendanceAccessGuard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin can access all attendance records
  if (user.isAdmin) {
    return <Outlet />;
  }
  
  // Group leaders (president, accountant, secretary) can access attendance
  if (user.role?.name === "President" || 
      user.role?.name === "Accountant" || 
      user.role?.name === "Secretary") {
    return <Outlet />;
  }
  
  // Regular members should be redirected to dashboard
  return <Navigate to="/dashboard" replace />;
}
