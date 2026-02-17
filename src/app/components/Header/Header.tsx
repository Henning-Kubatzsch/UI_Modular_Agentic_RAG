// src/app/components/Header/Header.tsx
"use client";

import Navbar from "./Navbar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Header({ isOpen, onClose }: SidebarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex  items-center justify-between px-4 py-3">
        
        <div className="flex items-center gap-4">
          {!isOpen && (
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Toggle Sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>      
          )}    
        </div>

        <Navbar />
      </div>
    </header>
  );
}
