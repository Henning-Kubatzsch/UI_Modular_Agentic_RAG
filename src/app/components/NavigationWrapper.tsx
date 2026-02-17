"use client";

import React, { useState } from "react";
import Header from "./Header/Header";
import Sidebar from "./Sidebar/Sidebar";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // h-screen und overflow-hidden sind wichtig für das "Sticky"-Gefühl
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      
      {/* SIDEBAR: Hat z-40 auf Mobile, wenn sie offen ist */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 flex-col transition-all duration-300 relative">
        <Header isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(!isSidebarOpen)}/>

        {/* HAUPTINHALT: Nur dieser Bereich darf scrollen */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* OVERLAY: 
            - z-30 (liegt über Header/Main, aber UNTER Sidebar z-40)
            - lg:hidden (verschwindet auf Desktop, damit nichts blurry wird) 
        */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-md lg:hidden" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}
      </div>
    </div>
  );
}