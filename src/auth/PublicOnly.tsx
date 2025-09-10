import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function PublicOnlyOutlet() {
    const { user } = useAuth();
    const location = useLocation();

    if (user) {
        return <Navigate to="/studentDashboard" replace state={{ from: location }} />;
    }

    return <Outlet />;
}
