"use client";

import React from "react";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={`
        /* Basis-Layout & Animation */
        h-full bg-black border-r border-white/10 transition-all duration-300 ease-in-out flex flex-col overflow-hidden
        
        /* MOBIL-LOGIK: 
           Wenn offen: Fixiert über dem Content, volle Breite, hoher Z-Index.
           Wenn zu: Komplett ausgeblendet (hidden), ab Desktop sichtbar (lg:flex).
        */
        ${isOpen 
          ? "fixed inset-0 z-40 w-full" 
          : "hidden lg:flex"
        }

        /* DESKTOP-LOGIK (lg):
           Schiebt den Inhalt. Breite wechselt zwischen 64 und 0.
        */
        lg:relative lg:inset-auto lg:z-0 
        ${isOpen ? "lg:w-64" : "lg:w-0"}
      `}
    >
      {/* 
          INNERER CONTAINER: 
          WICHTIG: 'w-64' und 'shrink-0' sorgen dafür, dass der Inhalt 
          beim Zuklappen stabil bleibt und nicht unschön umbricht.
      */}
      <div className="w-64 flex flex-col h-full py-4 px-3 shrink-0">
        
        {/* Header-Bereich in der Sidebar */}
        <div className={`flex mb-8 items-center ${isOpen ? "justify-between px-2" : "justify-center"}`}>
          <span className={`text-xl font-bold tracking-tighter transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            Modular Agentic RAG
          </span>
          
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Close Sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Menu Label */}
        <div className={`mb-4 flex items-center px-2 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
          <span className="text-xs font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">
            Browse
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {["Dashboard", "Projects", "Analytics"].map((item) => (
            <button
              key={item}
              className="w-full flex items-center gap-4 rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all group"
            >
              {/* Icon Placeholder */}
              <div className="min-w-[20px] h-[20px] rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />

              <span className={`transition-opacity duration-300 whitespace-nowrap ${isOpen ? "opacity-100" : "opacity-0"}`}>
                {item}
              </span>
            </button>
          ))}
        </nav>

        {/* Settings Link am Ende */}
        <div className="border-t border-white/10 pt-4">
          <Link 
            href="/settings" 
            className="flex items-center gap-4 px-3 py-2 text-sm text-white/70 hover:text-white transition-all group"
          >
             <div className="min-w-[20px] h-[20px] border border-white/30 rounded-sm group-hover:border-white transition-colors" />
             <span className={`transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                Settings
             </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
