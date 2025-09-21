import { MouseEvent, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo/fragefejden-brain-logo.png";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import MyPageModal from "../components/MyPageModal";
import { useAuth } from "../auth/AuthContext";
import { Classes } from "../Api/index";
import {
  HiOutlineUser,
} from "react-icons/hi2";
import Sidebar from "./SideBar";

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

  const [className, setClassName] = useState("—");
  const [points, setPoints] = useState<number>(0);
  const [rankNum, setRankNum] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, logout, loadingUser } = useAuth();
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

  // ✅ visar fullName först
  const roleLabel = user?.roles?.[0] ?? "användare";
  const displayName = `${roleLabel}: ${user?.fullName || user?.userName || user?.email || "—"}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      if (roleLabel === "student") {
        try {
          if (user?.id) {
            const xp = await Classes.GetLoggedInUserScore(user.id);
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
            if (user?.id) {
              const { myRank } = await Classes.GetClassLeaderboard(
                first?.id ?? first?.classId,
                user.id
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
  }, [roleLabel, user?.id]);

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
                    disabled={loadingUser}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg 
                               bg-white/10 hover:bg-white/20 transition 
                               text-yellow-300 italic disabled:opacity-50"
                  >
                    <HiOutlineUser className="h-5 w-5" />
                    <span>
                      {loadingUser ? "Laddar..." : displayName}
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

      {/* Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} />
      <MyPageModal isOpen={showMyPage} onClose={() => setShowMyPage(false)} />

      {/* Sidebar */}
      {sidebarOpen && user && (
        <Sidebar
          key={user?.id || user?.roles?.[0]}   // ✅ forcerar omrendering på rollbyte
          onClose={() => setSidebarOpen(false)}
          roleLabel={roleLabel}
          displayName={displayName}
          className={className}
          points={points}
          rankNum={rankNum}
          loading={loading}
          setShowMyPage={setShowMyPage}
        />
      )}
    </header>
  );
}
