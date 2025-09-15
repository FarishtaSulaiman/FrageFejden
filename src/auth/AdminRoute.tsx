// import { Navigate, Outlet } from "react-router-dom";
// import { useAuth } from "../auth/AuthContext"; // wherever you keep auth state

// function AdminRoute() {
//   const { user } = useAuth(); // assumes user object has a "role" field

//   if (!user) {
//     // Not logged in → redirect to login
//     return <Navigate to="/login" replace />;
//   }

// if (!user.roles?.includes("admin")) {
//   // Logged in but not an admin → redirect or show "Not Authorized"
//   return <Navigate to="/not-authorized" replace />;
// }

//   // Authorized → render children
//   return <Outlet />;
// }

// export default AdminRoute;