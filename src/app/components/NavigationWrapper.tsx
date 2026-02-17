"use client";

import React, { useState } from "react";
import Header from "./Header/Header";
import Sidebar from "./Sidebar/Sidebar";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar - Fixiert oder absolut je nach Screen-Größe */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 flex-col transition-all duration-300">
        {/* Header - bekommt die Toggle-Funktion */}
        <Header/>
        
        {/* Hauptinhalt */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Overlay für Mobile: schließt Sidebar bei Klick auf den Hintergrund */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
