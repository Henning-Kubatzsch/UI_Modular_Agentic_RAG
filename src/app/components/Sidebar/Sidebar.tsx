"use client";

import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-full w-64 border-r border-white/10 bg-zinc-950 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:static lg:translate-x-0 ${!isOpen && "lg:hidden"}`}
    >
      <div className="flex h-full flex-col p-4">
        <div className="mb-8 flex items-center px-2">
          <span className="text-sm font-bold uppercase tracking-widest text-white/50">History / Menu</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {["New Chat", "Recent Query 1", "Configuration A"].map((item) => (
            <button
              key={item}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <Link href="/settings" className="block px-3 py-2 text-sm text-white/70 hover:text-white">
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
