"use client";

import AskRag from './components/AskRag/AskRag';
import RAGConfigEditor from './components/RAGConfigEditor/RAGConfigEditor';


// -------------------- Page --------------------
export default function Page() {
  return (
    
    <div className="min-h-screen background text-foreground/70">
      {/* Header */}
     

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-8">
        <AskRag />
        <RAGConfigEditor />
      </main>
    </div>
  );
}
