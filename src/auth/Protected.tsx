import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedOutlet() {
    const { user } = useAuth();
    const loc = useLocation();
    return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc }} />;
}
