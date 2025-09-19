import { useSearchParams } from "react-router-dom";

export default function AdminPage() {
  const [params] = useSearchParams();
  const tab = params.get("tab") || "users"; // default: users

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0A0F1F] to-[#1E1B2E] text-white px-6">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-8">
        {tab === "users" && (
          <div>
            <h2 className="text-2xl font-bold text-yellow-300 mb-4">
              👥 Hantera användare
            </h2>
            <p className="text-white/80">
              Här kommer admins kunna hantera användare (lägga till, ta bort, ändra roller).
            </p>
          </div>
        )}

        {tab === "stats" && (
          <div>
            <h2 className="text-2xl font-bold text-green-300 mb-4">
              📊 Statistik
            </h2>
            <p className="text-white/80">
              Här visas statistik över quiz, elever och prestationer i systemet.
            </p>
          </div>
        )}

        {tab === "settings" && (
          <div>
            <h2 className="text-2xl font-bold text-blue-300 mb-4">
              ⚙️ Inställningar
            </h2>
            <p className="text-white/80">
              Här kan admin ändra systeminställningar, API-nycklar eller loggar.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 text-sm text-purple-300 italic">
        ✨ Adminpanelen – byggd för att göra ditt jobb enklare ✨
      </div>
    </div>
  );
}
