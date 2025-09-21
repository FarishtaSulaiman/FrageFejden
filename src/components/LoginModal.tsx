import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

type RoleLabel = "admin" | "teacher" | "student";

type TestAccount = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: RoleLabel;
  classes?: string[];
};

const TEST_ACCOUNTS: TestAccount[] = [
  {
    id: "admin@school.edu",
    email: "admin@school.edu",
    password: "Password123!",
    name: "Admin Användare",
    role: "admin",
    classes: ["—"],
  },
  {
    id: "tina.teacher@school.edu",
    email: "tina.teacher@school.edu",
    password: "Password123!",
    name: "Tina Larsson",
    role: "teacher",
    classes: ["8A"],
  },
  {
    id: "olof.teacher@school.edu",
    email: "olof.teacher@school.edu",
    password: "Password123!",
    name: "Olof Berg",
    role: "teacher",
    classes: ["9B", "9C"],
  },
  {
    id: "maria.teacher@school.edu",
    email: "maria.teacher@school.edu",
    password: "Password123!",
    name: "Maria Sund",
    role: "teacher",
    classes: ["10D"],
  },
  { id: "eva.8a@school.edu", email: "eva.8a@school.edu", password: "Password123!", name: "Eva Karlsson", role: "student", classes: ["8A"] },
  { id: "ahmed.8a@school.edu", email: "ahmed.8a@school.edu", password: "Password123!", name: "Ahmed Ali", role: "student", classes: ["8A"] },
  { id: "lisa.8a@school.edu", email: "lisa.8a@school.edu", password: "Password123!", name: "Lisa Norén", role: "student", classes: ["8A"] },
  { id: "jon.9b@school.edu", email: "jon.9b@school.edu", password: "Password123!", name: "Jon Persson", role: "student", classes: ["9B"] },
  { id: "mia.9b@school.edu", email: "mia.9b@school.edu", password: "Password123!", name: "Mia Östberg", role: "student", classes: ["9B"] },
  { id: "leo.9b@school.edu", email: "leo.9b@school.edu", password: "Password123!", name: "Leo Olsson", role: "student", classes: ["9B"] },
  { id: "nina.9c@school.edu", email: "nina.9c@school.edu", password: "Password123!", name: "Nina Holm", role: "student", classes: ["9C"] },
  { id: "vik.9c@school.edu", email: "vik.9c@school.edu", password: "Password123!", name: "Viktor Pettersson", role: "student", classes: ["9C"] },
  { id: "sam.9c@school.edu", email: "sam.9c@school.edu", password: "Password123!", name: "Sam Tran", role: "student", classes: ["9C"] },
  { id: "edvin.10d@school.edu", email: "edvin.10d@school.edu", password: "Password123!", name: "Edvin Åkesson", role: "student", classes: ["10D"] },
  { id: "sofia.10d@school.edu", email: "sofia.10d@school.edu", password: "Password123!", name: "Sofia Bergström", role: "student", classes: ["10D"] },
  { id: "maya.10d@school.edu", email: "maya.10d@school.edu", password: "Password123!", name: "Maya Widell", role: "student", classes: ["10D"] },
];

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { login, refresh } = useAuth(); // ✅ lägg till refresh
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ emailOrUserName: "", password: "" });
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const groups = useMemo(
    () => [
      { label: "Admin", accounts: TEST_ACCOUNTS.filter(a => a.role === "admin") },
      { label: "Lärare (med klasser)", accounts: TEST_ACCOUNTS.filter(a => a.role === "teacher") },
      { label: "Klass 8A (Elever)", accounts: TEST_ACCOUNTS.filter(a => a.role === "student" && a.classes?.includes("8A")) },
      { label: "Klass 9B (Elever)", accounts: TEST_ACCOUNTS.filter(a => a.role === "student" && a.classes?.includes("9B")) },
      { label: "Klass 9C (Elever)", accounts: TEST_ACCOUNTS.filter(a => a.role === "student" && a.classes?.includes("9C")) },
      { label: "Klass 10D (Elever)", accounts: TEST_ACCOUNTS.filter(a => a.role === "student" && a.classes?.includes("10D")) },
    ],
    []
  );

  useEffect(() => {
    const def = TEST_ACCOUNTS.find(a => a.email === "mia.9b@school.edu") || TEST_ACCOUNTS[0];
    if (def) {
      setSelectedAccountId(def.id);
      setFormData({ emailOrUserName: def.email, password: def.password });
    }
  }, []);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAccountId(id);
    const acc = TEST_ACCOUNTS.find(a => a.id === id);
    if (acc) {
      setFormData({ emailOrUserName: acc.email, password: acc.password });
      if (error) setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const me = await login(formData.emailOrUserName, formData.password);
      await refresh(); // ✅ tvinga uppdatering så Navbar/Sidebar får rätt user direkt

      const roles = me.roles.map(r => r.toLowerCase());
      if (roles.includes("admin")) {
        navigate("/admin");
      } else if (roles.includes("teacher")) {
        navigate("/teacher/klassvy"); // ✅ Teacher landingpage
      } else if (roles.includes("student")) {
        navigate("/studentDashboard");
      } else {
        navigate("/");
      }

      onLoginSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Inloggning misslyckades";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-purple-600 to-purple-800 rounded-lg shadow-2xl w-96 max-w-md mx-4 relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-4 text-white text-xl hover:text-gray-300 z-10"
          type="button"
        >
          ×
        </button>

        <div className="bg-purple-600 text-white text-center py-4 rounded-t-lg">
          <h2 className="text-xl font-medium">Logga in</h2>
        </div>

        <div className="bg-slate-800 p-8 rounded-b-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500 text-white p-3 rounded-lg text-sm">{error}</div>}

            {/* Snabbval */}
            <div>
              <label className="block text-sm text-white/80 mb-1">Snabbval (namn — roll — klass/er)</label>
              <select
                value={selectedAccountId}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 rounded-lg bg-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {groups.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {a.role}{a.classes?.length ? ` — ${a.classes.join(", ")}` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-1 text-xs text-white/60">
                Välj en testanvändare så fylls fälten i automatiskt (lösenord: <code>Password123!</code>).
              </p>
            </div>

            <input
              type="text"
              name="emailOrUserName"
              value={formData.emailOrUserName}
              onChange={handleInputChange}
              placeholder="Användarnamn eller e-post"
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Lösenord"
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <div className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="showPassword" className="text-sm">Visa lösenord</label>
            </div>

            <div className="text-left">
              <a href="#" className="text-blue-400 text-sm hover:underline">Glömt ditt lösenord?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isLoading ? "Loggar in..." : "Logga in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
