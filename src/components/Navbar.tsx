
import React from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/images/logo/fragefejden-brain-logo.png";

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
  const [open, setOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      <div
        className={[
          "h-11 w-full",
          "bg-gradient-to-r from-[#6C35E0] via-[#5828D3] to-[#6C35E0]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.35)]",
          "border-b border-[#4b1fb7]/60 text-white",
        ].join(" ")}
      >
        <nav aria-label="Huvudmeny" className="flex h-full w-full items-center">
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
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "text-[13px] leading-none transition-colors",
                        isActive
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

            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/95 hover:bg-white/10 active:scale-[0.98] md:hidden focus-visible:outline-none"
              aria-label="Öppna meny"
              aria-expanded={open}
              aria-controls="mobile-nav"
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
          open ? "max-h-[300px]" : "max-h-0",
          "transition-[max-height] duration-300 ease-out",
        ].join(" ")}
      >
        <ul className="px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="border-t border-white/10 first:border-t-0">
              <NavLink
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    "block py-3 text-[13px] transition-colors",
                    isActive
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
    </header>
  );
}
