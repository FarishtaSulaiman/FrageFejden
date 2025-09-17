import React, { useEffect, useState } from "react";
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

// lägg bilderna i en lista så vi kan loopa över dem
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

interface MyPageModalProps {
  isOpen: boolean; // om modalen ska visas eller inte
  onClose: () => void; // funktion för att stänga modalen
}

const MyPageModal: React.FC<MyPageModalProps> = ({ isOpen, onClose }) => {
  // användarens info
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<number | null>(null);

  // felmeddelande + laddning
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // körs när modalen öppnas
  useEffect(() => {
    if (!isOpen) return; // om stängd → gör inget

    const fetchUser = async () => {
      try {
        setLoading(true);
        const me = await AuthApiAuth.getMe(); // hämta inloggad användare

        setEmail(me.email ?? "");
        setUsername(me.userName ?? "");

        // dela upp fullName till förnamn + efternamn
        if (me.fullName) {
          const [first, ...last] = me.fullName.split(" ");
          setFirstName(first ?? "");
          setLastName(last.join(" ") ?? "");
        }

        // försök hitta vilken avatar användaren har
        if ((me as any).avatarUrl) {
          const match = (me as any).avatarUrl.match(/avatar(\d+)\.png$/);
          if (match) setAvatar(Number(match[1]));
        }
      } catch {
        setError("Kunde inte hämta användarinfo");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isOpen]);

  if (!isOpen) return null; // visa inget om modalen är stängd

  // spara ändringar
  const handleSave = async () => {
    try {
      if (!avatar) {
        setError("Du måste välja en avatar");
        return;
      }

      setLoading(true);

      // skickar till backend
      const dto: EditUserDto = {
        UserName: username,
        CurrentPassword: "",
        NewPassword: "",
        Email: email,
        AvatarUrl: `src/assets/images/avatar/avatar${avatar}.png`,
      };

      await AuthApiUser.editUser(dto);

      onClose(); // stäng modalen efter sparat
    } catch {
      setError("Kunde inte spara ändringar");
    } finally {
      setLoading(false);
    }
  };

  return (
    // bakgrund
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* själva rutan */}
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
          {error && <div className="bg-red-500 p-3 rounded">{error}</div>}
          {loading && <div className="text-center">Laddar...</div>}

          {/* email */}
          <input
            type="email"
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded bg-gray-200 text-black"
          />

          {/* förnamn */}
          <input
            type="text"
            value={firstName}
            placeholder="Förnamn"
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-4 py-3 rounded bg-gray-200 text-black"
          />

          {/* efternamn */}
          <input
            type="text"
            value={lastName}
            placeholder="Efternamn"
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-4 py-3 rounded bg-gray-200 text-black"
          />

          {/* användarnamn */}
          <input
            type="text"
            value={username}
            placeholder="Användarnamn"
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded bg-gray-200 text-black"
          />

          {/* avatarer */}
          <div>
            <p className="mb-2">Välj avatar:</p>
            <div className="grid grid-cols-6 gap-2">
              {avatars.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setAvatar(index + 1)}
                  className={`w-12 h-12 rounded-full cursor-pointer border-4 ${
                    avatar === index + 1
                      ? "border-green-500"
                      : "border-transparent"
                  }`}
                >
                  <img src={img} alt={`Avatar ${index + 1}`} />
                </div>
              ))}
            </div>
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
