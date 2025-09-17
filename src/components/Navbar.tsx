import { MouseEvent, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo/fragefejden-brain-logo.png";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import MyPageModal from "../components/MyPageModal";
import { useAuth } from "../auth/AuthContext";
import { AuthApi, Classes } from "../Api/index";
import {
  HiOutlineTrophy,
  HiOutlineChartBar,
  HiOutlineBell,
  HiOutlineUser,
} from "react-icons/hi2";

type NavItem = { to: string; label: string };

const NAV_ITEMS: readonly NavItem[] = [
  { to: "/about", label: "Om" },
  { to: "/demo", label: "Demo" },
  { to: "/features", label: "Funktioner" },
  { to: "/contact", label: "Kontakt" },
  { to: "/login", label: "Logga in" },
  { to: "/register", label: "Registrera" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [displayName, setDisplayName] = useState("Användare");
  const [className, setClassName] = useState("—");
  const [points, setPoints] = useState<number>(0);
  const [rankNum, setRankNum] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAuthRoute = (to: string) => to === "/login" || to === "/register";

  const handleNavClick = (e: MouseEvent, to: string) => {
    if (isAuthRoute(to)) {
      e.preventDefault();
      setOpen(false);
      if (to === "/login") setShowLogin(true);
      if (to === "/register") setShowRegister(true);
    } else {
      setOpen(false);
    }
  };

  // backendroller
  const roleLabel =
    user?.roles.includes("Admin")
      ? "Admin"
      : user?.roles.includes("Lärare")
        ? "Lärare"
        : user?.roles.includes("Student")
          ? "Student"
          : "Användare";

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      let me: any = null;
      try {
        me = await AuthApi.getMe();
        if (!alive) return;
        setDisplayName(me?.fullName?.trim() || "Användare");
      } catch {
        setDisplayName("Användare");
      }

      if (roleLabel === "Student") {
        try {
          if (me?.id) {
            const xp = await Classes.GetLoggedInUserScore(me.id);
            if (!alive) return;
            setPoints(typeof xp === "number" ? xp : 0);
          }
        } catch {
          setPoints(0);
        }

        try {
          const myClasses = await Classes.GetUsersClasses();
          if (!alive) return;
          if (Array.isArray(myClasses) && myClasses.length > 0) {
            const first = myClasses[0];
            const clsName = first?.name ?? first?.className ?? "—";
            setClassName(clsName || "—");
            if (me?.id) {
              const { myRank } = await Classes.GetClassLeaderboard(
                first?.id ?? first?.classId,
                me.id
              );
              if (!alive) return;
              setRankNum(myRank ?? null);
            }
          } else {
            setClassName("—");
            setRankNum(null);
          }
        } catch {
          setClassName("—");
          setRankNum(null);
        }
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [roleLabel]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div
        className={[
          "h-11 w-full",
          "bg-gradient-to-r from-[#6C35E0] via-[#5828D3] to-[#6C35E0]",
          "border-b border-[#4b1fb7]/60 text-white",
        ].join(" ")}
      >
        <nav className="flex h-full w-full items-center">
          <Link to="/" className="flex items-center gap-2 pl-2">
            <img
              src={logo}
              alt="FrågeFejden"
              className="h-7 w-7 rounded-full ring-1 ring-white/25"
            />
            <span className="text-[15px] font-semibold tracking-tight text-white/95">
              FrågeFejden
            </span>
          </Link>
          <div className="ml-auto flex items-center pr-3 md:pr-4">
            <ul className="hidden items-center gap-6 md:flex">
              {NAV_ITEMS.filter(
                (item) =>
                  !(user && (item.to === "/login" || item.to === "/register"))
              ).map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={(e) => handleNavClick(e, item.to)}
                    className={({ isActive }) =>
                      [
                        "text-[13px] leading-none transition-colors",
                        isActive && !isAuthRoute(item.to)
                          ? "text-white font-medium"
                          : "text-white/90 hover:text-white",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}

              {user && (
                <li>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg 
                               bg-white/10 hover:bg-white/20 transition 
                               text-yellow-300 italic"
                  >
                    <HiOutlineUser className="h-5 w-5" />
                    <span>
                      {roleLabel}: {displayName}
                    </span>
                  </button>
                </li>
              )}
            </ul>
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/95 hover:bg-white/10 active:scale-[0.98] md:hidden focus-visible:outline-none"
              aria-label="Öppna meny"
              aria-expanded={open}
              aria-controls="mobile-nav"
              type="button"
            >
              <span className="block h-[2px] w-5 bg-white" />
              <span className="sr-only">Meny</span>
            </button>
          </div>
        </nav>
      </div>
      <div
        id="mobile-nav"
        className={[
          "md:hidden overflow-hidden border-b border-[#4b1fb7]/60 w-full",
          "bg-gradient-to-b from-[#4F2ACB] to-[#3E20B3]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
          open ? "max-h-[320px]" : "max-h-0",
          "transition-[max-height] duration-300 ease-out",
        ].join(" ")}
      >
        <ul className="px-3 py-2">
          {NAV_ITEMS.filter(
            (item) =>
              !(user && (item.to === "/login" || item.to === "/register"))
          ).map((item) => (
            <li key={item.to} className="border-t border-white/10 first:border-t-0">
              <NavLink
                to={item.to}
                onClick={(e) => handleNavClick(e, item.to)}
                className={({ isActive }) =>
                  [
                    "block py-3 text-[13px] transition-colors",
                    isActive && !isAuthRoute(item.to)
                      ? "text-white font-medium"
                      : "text-white/90 hover:text-white",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
      <MyPageModal isOpen={showMyPage} onClose={() => setShowMyPage(false)} />

      {/* Sidebar */}
      {sidebarOpen && user && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="absolute right-0 top-0 h-full w-72 
            bg-white/10 backdrop-blur-xl border-l border-white/20 
            shadow-[0_8px_40px_rgba(0,0,0,0.6)] text-white flex flex-col"
          >
            <div className="p-6 border-b border-white/20">
              <div className="text-sm text-white/80">Hej</div>
              <div className="text-lg font-semibold">{displayName}</div>
              {roleLabel === "Student" && (
                <div className="text-xs text-white/70">Klass: {className}</div>
              )}
            </div>

            {roleLabel === "Student" && (
              <>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="flex flex-col items-center justify-center rounded-xl 
                    bg-white/10 backdrop-blur-md p-3 shadow border border-white/20">
                    <HiOutlineTrophy className="h-6 w-6" />
                    <span className="text-xs text-white/70 mt-1">Ranking</span>
                    <span className="font-semibold">
                      {loading ? "…" : rankNum ?? "—"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl 
                    bg-white/10 backdrop-blur-md p-3 shadow border border-white/20">
                    <HiOutlineChartBar className="h-6 w-6" />
                    <span className="text-xs text-white/70 mt-1">Poäng</span>
                    <span className="font-semibold">{loading ? "…" : points}</span>
                  </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  <NavLink
                    to="/studentDashboard"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10"
                  >
                    <HiOutlineTrophy className="h-5 w-5" /> Mina klasser
                  </NavLink>
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      setShowMyPage(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left"
                  >
                    <HiOutlineUser className="h-5 w-5" /> Min profil
                  </button>
                  <NavLink
                    to="/notifications"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10"
                  >
                    <HiOutlineBell className="h-5 w-5" /> Notiser
                  </NavLink>
                </nav>
              </>
            )}

            {roleLabel === "Lärare" && (
              <nav className="flex-1 p-4 space-y-2">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate("/teacher/klassvy");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left"
                >
                  <HiOutlineTrophy className="h-5 w-5" /> Klass vy
                </button>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate("/teacherQuizStatistics");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left"
                >
                  <HiOutlineChartBar className="h-5 w-5" /> Quiz Statistik
                </button>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigate("/skapa-quiz");
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left"
                >
                  <HiOutlineUser className="h-5 w-5" /> Skapa Quiz
                </button>
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    setShowMyPage(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 w-full text-left"
                >
                  <HiOutlineUser className="h-5 w-5" /> Min profil
                </button>
              </nav>
            )}

            <div className="p-4 border-t border-white/20">
              <button
                onClick={async () => {
                  await logout(); //  vänta klart innan redirect
                  setSidebarOpen(false);
                  navigate("/");  // alltid hem
                }}
                className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm"
              >
                Logga ut
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
