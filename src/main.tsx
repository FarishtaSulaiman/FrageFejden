import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import App from "./App";
import Login from "./pages/login/Login";
import "./index.css";
import Register from "./pages/Register/Register";
import ApiHealth from "./pages/apiHealth/ApiHealth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<App />} />
          <Route path="/register" element={<Register />} />
          <Route path="/health" element={<ApiHealth />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
