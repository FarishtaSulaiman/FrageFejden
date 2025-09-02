// src/components/Footer.tsx
import React from "react";

export default function Footer() {
  return (
    <footer className="relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] border-t border-white/10 bg-ink2">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 text-[12.5px] text-white/85 lg:px-6">
        <div className="flex items-center gap-6">
          <a href="#" className="transition hover:text-white">Användarvillkor</a>
          <a href="#" className="transition hover:text-white">Integritet</a>
          <a href="#" className="transition hover:text-white">Support</a>
        </div>
        <div className="flex items-center gap-3 opacity-80">
          <span aria-label="X" title="X">✕</span>
          <span aria-label="Instagram" title="Instagram">📸</span>
          <span aria-label="Twitter" title="Twitter">🐦</span>
          <span aria-label="LinkedIn" title="LinkedIn">in</span>
        </div>
      </div>
    </footer>
  );
}
