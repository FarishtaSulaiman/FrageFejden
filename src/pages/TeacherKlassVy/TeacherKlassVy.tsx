import React, { useState } from "react";
import avatar1 from "../../assets/images/avatar/avatar1.png";

interface User {
  name: string;
  username: string;
}

const TeacherKlassVy: React.FC = () => {
  const [className, setClassName] = useState("8C");
  const classes = ["8A", "8B", "8C", "9A", "9B"]; // lista med tillgängliga klasser

  const [users, setUsers] = useState<User[]>([
    { name: "Lina Larsson", username: "Lina4ever" }, // hårdkodade elever som visas
    { name: "Kalle Svensson", username: "Kokokalle" },
  ]);

  //modalen visas eller inte
  const [showModal, setShowModal] = useState(false);
  //vilken användare som ska bort
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  //funktion för att öppna modalen och sätta vilken användare som ska tas bort
  const openModal = (username: string) => {
    setUserToDelete(username);
    setShowModal(true);
  };
  //funktion för att stänga modalen och nollställa userToDelete
  const closeModal = () => {
    setUserToDelete(null);
    setShowModal(false);
  };
  //funktion som körs när borttagning bekräftas i modalen
  const confirmDelete = () => {
    if (userToDelete) {
      //tar bort användaren från listan
      setUsers((prev) => prev.filter((u) => u.username !== userToDelete));
    }
    closeModal();
  };

  return (
    <div className="min-h-screen bg-[#0b0d2a] text-white flex flex-col">
      {/* admin-ikon och namn i övre högra hörnet */}
      <div className="absolute top-16 right-6 flex items-center gap-2 cursor-pointer select-none">
        <span className="font-semibold text-white">Admin</span>
        <img
          src={avatar1}
          alt="Admin avatar"
          className="w-8 h-8 rounded-full object-cover border-2 border-yellow-400"
        />
      </div>
      <main className="flex-grow flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-3xl">
          <h1 className="text-4xl font-extrabold text-yellow-400 mb-8">
            FRÅGEFEJDEN
          </h1>

          <h2 className="text-xl font-semibold mb-4">Välj klass</h2>

          <div className="flex items-center gap-4 mb-8">
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-32 px-4 py-2 rounded text-black font-semibold bg-gray-200"
            >
              {classes.map((klass) => (
                <option key={klass} value={klass}>
                  {klass}
                </option>
              ))}
            </select>
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-extrabold text-lg">
              Skapa Quiz
            </button>
          </div>

          <div className="bg-white text-black rounded-md shadow">
            <div className="grid grid-cols-[3fr_2fr_1fr] font-bold border-b p-4">
              <div>Namn</div>
              <div>Användarnamn</div>
              <div></div>
            </div>
            {users.map((user) => (
              <div
                key={user.username}
                className="grid grid-cols-[3fr_2fr_1fr] items-center border-t p-4"
              >
                <div>{user.name}</div>
                <div>{user.username}</div>
                <button
                  onClick={() => openModal(user.username)}
                  className="bg-red-500 text-white px-2 py-1 rounded mx-auto block"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* modal för bekräftelse vid borttagning av användare */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-bold mb-4">Bekräfta borttagning</h3>
            <p className="mb-6">Är du säker på att du vill ta bort eleven?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
              >
                Avbryt
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Ta bort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherKlassVy;
