import React, { useEffect, useState } from "react";
// importerar API:er för autentisering och användarhantering
import { AuthApi as AuthApiAuth } from "../Api/AuthApi/auth";
import { AuthApi as AuthApiUser, EditUserDto } from "../Api/AuthApi/user";

// alla avatar-bilder
import avatar1 from "../assets/images/avatar/avatar1.png";
import avatar2 from "../assets/images/avatar/avatar2.png";
import avatar3 from "../assets/images/avatar/avatar3.png";
import avatar4 from "../assets/images/avatar/avatar4.png";
import avatar5 from "../assets/images/avatar/avatar5.png";
import avatar6 from "../assets/images/avatar/avatar6.png";
import avatar7 from "../assets/images/avatar/avatar7.png";
import avatar8 from "../assets/images/avatar/avatar8.png";
import avatar9 from "../assets/images/avatar/avatar9.png";
import avatar10 from "../assets/images/avatar/avatar10.png";
import avatar11 from "../assets/images/avatar/avatar11.png";
import avatar12 from "../assets/images/avatar/avatar12.png";

// lägger bilderna i en lista så vi kan loopa över dem
const avatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
  avatar11,
  avatar12,
];

// typdefinition för props till modalen
interface MyPageModalProps {
  isOpen: boolean; // om modalen ska visas
  onClose: () => void; // callback för att stänga modalen
}

const MyPageModal: React.FC<MyPageModalProps> = ({ isOpen, onClose }) => {
  // state för användarens info
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // <- ändrat till string
  // state för lösenordsändring
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // hämtar användarinfo när modalen öppnas
  useEffect(() => {
    if (!isOpen) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const me = await AuthApiAuth.getMe(); // hämta inloggad användare

        setEmail(me.email ?? "");
        setUsername(me.userName ?? "");
        // dela fullName till förnamn och efternamn
        if (me.fullName) {
          const [first, ...last] = me.fullName.split(" ");
          setFirstName(first ?? "");
          setLastName(last.join(" ") ?? "");
        }

        setAvatarUrl((me as any).avatarUrl ?? null); // spara avatar-url
      } catch {
        setError("Kunde inte hämta användarinfo");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isOpen]);

  if (!isOpen) return null;

  // funktion som körs när användaren klickar på "Spara"
  const handleSave = async () => {
    try {
      setError("");
      // kolla att avatar är vald
      if (!avatarUrl) {
        setError("Du måste välja en avatar");
        return;
      }
      // hantera lösenordsändring
      if (newPassword || confirmPassword) {
        if (!currentPassword) {
          setError(
            "Du måste ange ditt nuvarande lösenord för att ändra lösenordet"
          );
          return;
        }
        if (newPassword !== confirmPassword) {
          setError("Nytt lösenord och bekräftelse matchar inte");
          return;
        }
      }

      setLoading(true);
      // bygg DTO för API-anrop
      const dto: EditUserDto = {
        UserName: username,
        Email: email,
        AvatarUrl: avatarUrl,
        CurrentPassword: currentPassword || "",
        NewPassword: newPassword || "",
      };

      await AuthApiUser.editUser(dto); // skicka ändringar till API
      window.location.reload(); // uppdatera sidan efter ändring
      onClose(); // stäng modalen
    } catch {
      setError("Kunde inte spara ändringar"); // fel vid sparande
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* modalruta */}
      <div className="bg-[#1a1f3c]/80 backdrop-blur-md border border-white/30 rounded-lg shadow-2xl w-full max-w-xl overflow-auto max-h-[90vh] relative text-white">
        {/* stäng-knapp */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-2xl hover:text-gray-300"
        >
          ×
        </button>

        {/* rubrik */}
        <div className="text-center py-6">
          <h2 className="text-4xl font-extrabold text-yellow-400">MIN SIDA</h2>
        </div>

        {/* innehåll */}
        <div className="px-8 pb-8 space-y-4">
          {/* felmeddelande */}
          {error && <div className="bg-red-500 p-3 rounded">{error}</div>}
          {/* laddning */}
          {loading && <div className="text-center">Laddar...</div>}

          {/* namn med read-only */}
          <div>
            <label className="block text-sm font-semibold mb-1">Namn</label>
            <input
              type="text"
              value={`${firstName} ${lastName}`}
              readOnly
              className="w-full px-4 py-3 rounded bg-gray-400 text-black cursor-not-allowed"
            />
          </div>

          {/* email */}
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black"
            />
          </div>

          {/* användarnamn */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Användarnamn
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black"
            />
          </div>

          {/* avatarer */}
          <div>
            <p className="mb-2">Välj avatar:</p>
            <div className="grid grid-cols-6 gap-2">
              {avatars.map((img) => (
                <div
                  key={img}
                  onClick={() => setAvatarUrl(img)}
                  className={`w-12 h-12 rounded-full cursor-pointer border-4 ${
                    avatarUrl === img
                      ? "border-green-500"
                      : "border-transparent"
                  }`}
                >
                  <img src={img} alt="Avatar" />
                </div>
              ))}
            </div>
          </div>

          {/* nuvarande lösenord */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Nuvarande lösenord
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black"
            />
          </div>

          {/* nytt lösenord */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Nytt lösenord
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black"
            />
          </div>

          {/* bekräfta nytt lösenord */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              Bekräfta nytt lösenord
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black"
            />
          </div>

          {/* spara-knapp */}
          <button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md flex items-center justify-center"
            disabled={loading}
          >
            {loading ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPageModal;
