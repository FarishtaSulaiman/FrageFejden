import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface RoleRouteProps {
  allowedRoles: string[];
}


function normalizeRole(role: string): string {
  switch (role.toLowerCase()) {
    case "lärare":
    case "teacher":
      return "Teacher";
    case "elev":
    case "student":
      return "Student";
    case "admin":
      return "Admin";
    default:
      return role;
  }
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const normalizedRoles = user.roles?.map(normalizeRole) ?? [];

  if (normalizedRoles.includes("Admin")) {
    return <Outlet />;
  }

  const hasAccess = normalizedRoles.some((role) =>
    allowedRoles.map(normalizeRole).includes(role)
  );

  if (!hasAccess) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <Outlet />;
}
