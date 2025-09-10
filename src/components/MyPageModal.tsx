import React, { useEffect, useState } from "react";

// importera alla 12 avatarer
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
  isOpen: boolean;
  onClose: () => void;
}

const MyPageModal: React.FC<MyPageModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<number | null>(null);
  const [error, setError] = useState("");

  // fyll mockad användare när modalen öppnas
  useEffect(() => {
    if (!isOpen) return;

    setEmail("test@example.com");
    setFirstName("Test");
    setLastName("User");
    setUsername("testuser");
    setAvatar(1);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      console.log("Sparade användare:", {
        email,
        firstName,
        lastName,
        username,
        avatar,
      });
      onClose();
    } catch (err) {
      setError("Kunde inte spara ändringar");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b0d2a] rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl overflow-auto max-h-[90vh] relative text-white">
        {/* Stäng-knapp */}
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-white text-2xl hover:text-gray-300"
          type="button"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center py-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-yellow-400">
            MIN SIDA
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 pb-8 space-y-4">
          {error && (
            <div className="bg-red-500 text-white p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Förnamn */}
          <div>
            <label className="block text-sm mb-1">Förnamn</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Efternamn */}
          <div>
            <label className="block text-sm mb-1">Efternamn</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Användarnamn */}
          <div>
            <label className="block text-sm mb-1">Användarnamn</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded bg-gray-200 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Avatar-val */}
          <div>
            <label className="block text-sm mb-2">Välj avatar</label>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 sm:gap-3">
              {avatars.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setAvatar(index + 1)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full cursor-pointer border-4 ${
                    avatar === index + 1
                      ? "border-green-500"
                      : "border-transparent"
                  } overflow-hidden`}
                >
                  <img
                    src={img}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Spara-knapp */}
          <button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md flex items-center justify-center"
          >
            Spara
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPageModal;
