import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineTrophy,
  HiOutlineChartBar,
  HiOutlineBell,
  HiOutlineUser,
} from "react-icons/hi2";
import { useAuth } from "../auth/AuthContext";

interface SidebarProps {
  onClose: () => void;
  roleLabel: string;
  displayName: string;
  className: string;
  points: number;
  rankNum: number | null;
  loading: boolean;
  setShowMyPage: (value: boolean) => void;
}

export default function Sidebar({
  onClose,
  roleLabel,
  displayName,
  className,
  points,
  rankNum,
  loading,
  setShowMyPage,
}: SidebarProps) {
  const { logout, loadingUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full w-72 
        bg-white/10 backdrop-blur-xl border-l border-white/20 
        shadow-[0_8px_40px_rgba(0,0,0,0.6)] text-white flex flex-col"
      >
        <div className="p-6 border-b border-white/20">
          <div className="text-sm text-white/80">Hej</div>
          <div className="text-lg font-semibold">{displayName}</div>
          {roleLabel === "student" && (
            <div className="text-xs text-white/70">Klass: {className}</div>
          )}
        </div>

        {roleLabel === "student" && (
          <>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div
                className="flex flex-col items-center justify-center rounded-xl 
                bg-white/10 backdrop-blur-md p-3 shadow border border-white/20"
              >
                <HiOutlineTrophy className="h-6 w-6" />
                <span className="text-xs text-white/70 mt-1">Ranking</span>
                <span className="font-semibold">
                  {loading ? "…" : rankNum ?? "—"}
                </span>
              </div>
              <div
                className="flex flex-col items-center justify-center rounded-xl 
                bg-white/10 backdrop-blur-md p-3 shadow border border-white/20"
              >
                <HiOutlineChartBar className="h-6 w-6" />
                <span className="text-xs text-white/70 mt-1">Poäng</span>
                <span className="font-semibold">{loading ? "…" : points}</span>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <NavLink
                to="/leaderboard"
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10"
              >
                <HiOutlineTrophy className="h-5 w-5" /> Mina poäng
              </NavLink>
              <button
                onClick={() => {
                  onClose();
                  setShowMyPage(true);
                }}
                disabled={loadingUser}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left disabled:opacity-50"
              >
                <HiOutlineUser className="h-5 w-5" /> Min profil
              </button>
              <NavLink
                to="/notifications"
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10"
              >
                <HiOutlineBell className="h-5 w-5" /> Dashboard
              </NavLink>
            </nav>
          </>
        )}

        {roleLabel === "teacher" && (
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => {
                onClose();
                navigate("/teacher/klassvy");
              }}
              disabled={loadingUser}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left disabled:opacity-50"
            >
              <HiOutlineTrophy className="h-5 w-5" /> Klass vy / Skapa Quiz
            </button>
            <button
              onClick={() => {
                onClose();
                navigate("/teacherQuizStatistics");
              }}
              disabled={loadingUser}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left disabled:opacity-50"
            >
              <HiOutlineChartBar className="h-5 w-5" /> Quiz Statistik
            </button>
            <button
              onClick={() => {
                onClose();
                setShowMyPage(true);
              }}
              disabled={loadingUser}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left disabled:opacity-50"
            >
              <HiOutlineUser className="h-5 w-5" /> Min profil
            </button>
          </nav>
        )}

        {roleLabel === "admin" && (
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => {
                onClose();
                navigate("/admin");
              }}
              disabled={loadingUser}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left disabled:opacity-50"
            >
              <HiOutlineUser className="h-5 w-5" /> Admin Dashboard
            </button>
            <button
              onClick={() => {
                onClose();
                navigate("/admin/details");
              }}
              disabled={loadingUser}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left disabled:opacity-50"
            >
              <HiOutlineChartBar className="h-5 w-5" /> Admin Detaljer
            </button>
            <button
              onClick={() => {
                onClose();
                setShowMyPage(true);
              }}
              disabled={loadingUser}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left disabled:opacity-50"
            >
              <HiOutlineUser className="h-5 w-5" /> Min profil
            </button>
          </nav>
        )}

        <div className="p-4 border-t border-white/20">
          <button
            onClick={async () => {
              await logout();
              onClose();
              navigate("/");
            }}
            disabled={loadingUser}
            className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm disabled:opacity-50"
          >
            {loadingUser ? "Loggar ut..." : "Logga ut"}
          </button>
        </div>
      </div>
    </div>
  );
}
