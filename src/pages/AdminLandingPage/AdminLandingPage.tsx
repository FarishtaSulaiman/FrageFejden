import React from "react";
import { NavLink } from "react-router-dom";
import { HiOutlineCog, HiOutlineUserGroup, HiOutlineChartBar } from "react-icons/hi2";
import { useAuth } from "../../auth/AuthContext";

export default function AdminLandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0A0F1F] to-[#1E1B2E] text-white px-6">
      {/* Rubrik */}
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-purple-300">
        Adminpanel
      </h1>
      <p className="text-lg text-white/80 mb-10">
        Välkommen {user?.fullName || user?.userName || "Admin"} 👋
      </p>

      {/* Kortmeny */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
        <NavLink
          to="/admin/details?tab=users"
          className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer shadow-lg border border-white/20"
        >
          <HiOutlineUserGroup className="h-10 w-10 text-yellow-300 mb-3" />
          <h2 className="text-lg font-semibold">Användare</h2>
          <p className="text-sm text-white/70 mt-1">Hantera konton och roller</p>
        </NavLink>

        <NavLink
          to="/admin/details?tab=stats"
          className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer shadow-lg border border-white/20"
        >
          <HiOutlineChartBar className="h-10 w-10 text-green-300 mb-3" />
          <h2 className="text-lg font-semibold">Statistik</h2>
          <p className="text-sm text-white/70 mt-1">Se trender och analyser</p>
        </NavLink>

        <NavLink
          to="/admin/details?tab=settings"
          className="flex flex-col items-center justify-center p-6 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer shadow-lg border border-white/20"
        >
          <HiOutlineCog className="h-10 w-10 text-blue-300 mb-3" />
          <h2 className="text-lg font-semibold">Inställningar</h2>
          <p className="text-sm text-white/70 mt-1">Systeminställningar och loggar</p>
        </NavLink>
      </div>

      <div className="mt-12 text-sm text-purple-300 italic">
        ✨ Här har du full kontroll – använd makten väl ✨
      </div>
    </div>
  );
}
