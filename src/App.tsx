import { useState } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import { Protected } from "./auth/Protected";
import { useAuth } from "./auth/AuthContext";

function Home() {
  const [count, setCount] = useState(0);
  const { user, logout } = useAuth();

  return (
    <>
      <h1>Vite + React</h1>
      <p>Logged in as: <b>{user?.email ?? user?.id}</b></p>
      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <p>
          <button onClick={logout}>Logout</button>
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more. <Link to="/login">Login</Link>
      </p>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Protected>
            <Home />
          </Protected>
        }
      />
    </Routes>
  );
}
