"use client";

import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return  (
    <aside 
      className={`${
        isOpen ? "w-64" : "w-16"
      } bg-[#050505] border-r border-white/10 transition-all duration-300 ease-in-out overflow-hidden`}
    >
      <div className="flex h-full flex-col py-4 px-3">
        
        {/* Toggle Button - Always Visible */}
        <div className={`flex mb-8 ${isOpen ? "justify-start px-2" : "justify-center"}`}>
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
        </div>

        {/* Menu Label - Fades out when closed */}
        <div className={`mb-4 flex items-center px-2 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 h-0"}`}>
          <span className="text-xs font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">
            Browse
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {["item 1", "itme 2", "item 3"].map((item) => (
            <button
              key={item}
              className={`w-full flex items-center gap-4 rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all`}
              title={!isOpen ? item : ""}
            >
              {/* Icon Placeholder (Optional, looks better in mini-strip) */}
              <div className="min-w-[20px] h-[20px] rounded-full bg-white/10" />
              
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                {item}
              </span>
            </button>
          ))}
        </nav>

        {/* Settings Link */}
        <div className="border-t border-white/10 pt-4">
          <Link 
            href="/settings" 
            className={`flex items-center gap-4 px-3 py-2 text-sm text-white/70 hover:text-white transition-all`}
          >
             <div className="min-w-[20px] h-[20px] border border-white/30 rounded-sm" />
             <span className={`transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                Settings
             </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
