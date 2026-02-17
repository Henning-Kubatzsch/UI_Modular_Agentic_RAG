// src/app/components/Header/Header.tsx
"use client";

import Navbar from "./Navbar";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        
        <div className="flex items-center gap-4">
   

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded bg-white/20" />
            <h1 className="hidden text-lg font-semibold sm:block">Modular RAG</h1>
          </div>
        </div>

        <Navbar />
      </div>
    </header>
  );
}
