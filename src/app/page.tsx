"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState, useRef, Component } from "react";
import { pruneEmpty } from "../../utils";

import AskRag from './components/AskRag/AskRag';
import RAGConfigEditor from './components/RAGConfigEditor/RAGConfigEditor'


// -------------------- Page --------------------
export default function Page() {
  return (
    
    <div className="min-h-screen background text-foreground/70">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-white/20" />
            <div>
              <h1 className="text-xl font-semibold">Modular Agentic RAG</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">       
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-8">
        <AskRag />
        <RAGConfigEditor/>
      </main>
    </div>
  );
}
