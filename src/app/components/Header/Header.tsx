// src/app/components/Header/Header.tsx
"use client";

import Navbar from "./Navbar";

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="rounded-md p-2 hover:bg-white/10 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

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
