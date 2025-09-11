//för att kolla hur modalen ser ut

import { useState } from "react";
import MyPageModal from "../../components/MyPageModal";

export default function MyPagePage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F1F] text-white">
      <h1 className="text-3xl font-bold mb-6">My Page</h1>

      {/* knapp för att öppna modalen igen om man stänger den */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md"
        >
          Öppna modal igen
        </button>
      )}

      {/* modalen */}
      <MyPageModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
