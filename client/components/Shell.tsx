"use client";

import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import Topbar from "@/components/Topbar";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Nav />
      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col relative">
        {/* Caro grid background, masked to fade at edges (below topbar) */}
        <div className="ez-grid" aria-hidden />
        <Topbar />
        {/* Scroll area */}
        <div className="flex-1 relative z-[1]">
          <main className="max-w-[880px] mx-auto px-5 py-8 pb-24 md:px-10 md:py-10 md:pb-20">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
