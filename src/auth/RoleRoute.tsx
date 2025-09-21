import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface RoleRouteProps {
  allowedRoles: string[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const userRoles = user.roles ?? [];

  // Admin → admin dashboard
  if (userRoles.includes("admin")) {
    if (allowedRoles.includes("admin")) {
      return <Outlet />;
    }
    return <Navigate to="/admin" replace />;
  }

  // Teacher → TeacherKlassVy (landing page)
  if (userRoles.includes("teacher")) {
    if (allowedRoles.includes("teacher")) {
      return <Outlet />;
    }
    return <Navigate to="/teacher/klassvy" replace />;
  }

  // Student → StudentDashboard (landing page)
  if (userRoles.includes("student")) {
    if (allowedRoles.includes("student")) {
      return <Outlet />;
    }
    return <Navigate to="/studentdashboard" replace />;
  }

  // Fallback
  return <Navigate to="/not-authorized" replace />;
}
