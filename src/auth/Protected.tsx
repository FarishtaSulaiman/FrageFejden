import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Komponent som skyddar ruttar och omdirigerar till inloggning om användaren inte är autentiserad
export const Protected: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user } = useAuth();
    const loc = useLocation();
    if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
    return <>{children}</>;
};
