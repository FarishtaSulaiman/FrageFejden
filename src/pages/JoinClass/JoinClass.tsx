import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ClassAccess } from "../../Api/ClassApi/ClassAccess";

const JoinClassPage: React.FC = () => {
  const { joinCode: routeJoinCode } = useParams<{ joinCode: string }>();
  const joinCode = useMemo(() => (routeJoinCode ?? "").trim(), [routeJoinCode]);
  const navigate = useNavigate();

  const { registerStudent, user } = useAuth();

  const [className, setClassName] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [classId, setClassId] = useState<string | undefined>(undefined);

  const [formData, setFormData] = useState({
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Reset fälten varje gång joinCode ändras ELLER vid mount
  useEffect(() => {
    setFormData({
      email: "",
      userName: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    });
  }, [joinCode]);

  useEffect(() => {
    let cancelled = false;

    async function validateAndFetch() {
      if (!joinCode) {
        setIsValid(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      setError("");

      try {
        const data = await ClassAccess.validateJoinCode(joinCode);
        if (!cancelled) {
          setIsValid(!!data.isValid);
          setClassId(data.classId);
          setClassName(data.className ?? "");
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Kunde inte verifiera joinkoden.");
          setIsValid(false);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    validateAndFetch();
    return () => {
      cancelled = true;
    };
  }, [joinCode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Lösenorden matchar inte");
      setIsLoading(false);
      return;
    }

    try {
      // registerStudent använder AuthApi.register → POST /Auth/register
      if (!user) {
        await registerStudent(
          formData.email,
          formData.userName,
          formData.password,
          formData.fullName
        );
      }

      // Anslut till klass via API
      await ClassAccess.join(joinCode);

      //  Navigera till klassvy
      navigate(`/classes/${classId}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Registrering eller anslutning misslyckades");
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="animate-pulse bg-purple-700 h-12 rounded-t-2xl" />
          <div className="bg-slate-800 p-8 rounded-b-2xl shadow-2xl">
            <div className="h-6 bg-slate-700 rounded mb-4" />
            <div className="h-10 bg-slate-700 rounded mb-3" />
            <div className="h-10 bg-slate-700 rounded mb-3" />
            <div className="h-10 bg-slate-700 rounded mb-3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-b from-purple-600 to-purple-800 rounded-t-2xl shadow-2xl">
          <div className="text-white text-center py-5 rounded-t-2xl">
            <h2 className="text-xl font-semibold">
              {isValid ? (className ? className : "Okänd klass") : "Ogiltig joinkod"}
            </h2>
            {isValid && (
              <p className="text-sm text-white/80 mt-1">Joinkod: {joinCode}</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 p-8 rounded-b-2xl shadow-2xl">
          {!isValid ? (
            <div className="bg-red-500 text-white p-3 rounded-lg text-sm">
              {error || "Joinkoden är inte giltig eller har gått ut."}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500 text-white p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                required
                autoComplete="off"
                className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 
                           placeholder-gray-500 border-none focus:outline-none 
                           focus:ring-2 focus:ring-purple-400"
              />

              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="Användarnamn"
                required
                autoComplete="off"
                className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 
                           placeholder-gray-500 border-none focus:outline-none 
                           focus:ring-2 focus:ring-purple-400"
              />

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Fullständigt namn"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 
                           placeholder-gray-500 border-none focus:outline-none 
                           focus:ring-2 focus:ring-purple-400"
              />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Lösenord"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 
                           placeholder-gray-500 border-none focus:outline-none 
                           focus:ring-2 focus:ring-purple-400"
              />

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Upprepa lösenord"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 
                           placeholder-gray-500 border-none focus:outline-none 
                           focus:ring-2 focus:ring-purple-400"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 
                           text-white font-medium py-3 rounded-lg transition-colors"
              >
                {isLoading ? "Går med..." : "Registrera & gå med"}
              </button>

              <p className="text-sm text-slate-300 text-center">
                Har du redan ett konto?{" "}
                <a className="underline hover:text-white" href="/login">
                  Logga in
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinClassPage;
