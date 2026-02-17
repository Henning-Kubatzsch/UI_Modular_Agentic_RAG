"use client"

import {useEffect, useMemo, useState, useRef} from "react"
const RAG_URL = process.env.NEXT_PUBLIC_RAG_URL ?? "http://127.0.0.1:8000/rag_ui";


export default function AskRag() {
  const [q, setQ] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [isChromeIOS, setIsChromeIOS] = useState(false);

  useEffect(() => {
    setIsChromeIOS(/CriOS/.test(navigator.userAgent));
    return() => abortRef.current?.abort();
  }, []);

  // only executed at first render as the dependeny Array is empty [], but the method body at this moment is empty
  // also called at unmount, all useEffect methods have an cleanup function -> when unmount all AbortController get aborted
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function append(text: string) {
    if (!text) return;
    // prev: actual state passed from react
    setAnswer((prev) => (prev ? prev + text : text));
  }

  function pushChunk(chunk: string, isSSE: boolean) {
    if (!isSSE) {
      append(chunk);
      return;
    }
    //splits at break lines, /: start and end of Regex, ?: optional, 
    const lines = chunk.split(/\r?\n/);
    for (const line of lines) {
      if (!line) continue;
      // slice(5): cut first 5 digits, trimStart(): deletes whitespace at beginning
      if (line.startsWith("data:")) append(line.slice(5).trimStart() + "\n");
    }
  }

  async function ask(){
    if (isChromeIOS){
      await askChromeIOS();
    }else{
      await askStandard();
    }
  }

  async function askChromeIOS() {
      if (!q.trim()) return;
      setAnswer("");
      setLoading(true);
      
      try {
        const res = await fetch(RAG_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
          mode: "cors",
          credentials: "omit",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || res.statusText);
        }

        // ✅ Warte auf komplette Response (kein Streaming)
        const text = await res.text();
        
        try {
          const json = JSON.parse(text);
          append(json?.answer ?? text);
        } catch {
          append(text);
        }
        
      } catch (e: any) {
        append((answer ? "\n\n" : "") + "Error: " + (e?.message ?? String(e)));
      } finally {
        setLoading(false);
      }
    }

  async function askStandard() {
    // if only q only consists of whitespaces: return
    if (!q.trim()) return;
    setAnswer("");
    setLoading(true);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch(RAG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
        signal: ac.signal,
        mode: "cors",
        credentials: "omit",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || res.statusText);
      }
      // check content type
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const isSSE = ct.includes("text/event-stream");

      if (!res.body) {
        // Fallback: JSON answer without stream
        const text = await res.text().catch(() => "");
        if (text) {
          try {
            const j = JSON.parse(text);
            append(j?.answer ?? text);
          } catch {
            append(text);
          }
        }
        return;
      }

      // read stream
      // getReader() comes from fetch() and returns a ReadableStream instance
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        // every reader.read() call takes one chunk from buffer, if there is no chunk the the method is blocked
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        pushChunk(chunk, isSSE);
      }
      // used if stream aborts before reading whole buffer
      const tail = decoder.decode();
      if (tail) pushChunk(tail, isSSE);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        append((answer ? "\n\n" : "") + "Error: " + (e?.message ?? String(e)));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }

  return (
    //<section className="rounded-xl border border-[#3b82f6]/30 bg-white/[0.13]">
    <section className="rounded-xl border border-white/10 bg-white/[0.03] ">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h2 className="text-lg font-semibold">Ask the model (RAG)</h2>     
        <div className="flex items-center gap-2">
          {!loading ? (
            <button
              onClick={ask}
              className="rounded-md bg-[var(--button_standard)] px-4 py-2 text-sm font-medium text-foreground hover:bg-[var(--button_standard_hover)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
              disabled={!q.trim()}
            >
              ▶ Run
            </button>
          ) : (
            <button
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-foreground hover:bg-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
            >
              ■ Stop
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="grid grid-cols-[200px,1fr] items-start gap-3">
          <div className="text-sm text-foreground whitespace-nowrap select-none">
            <span className="font-mono">question</span>
          </div>
          <div className="min-w-0">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
              }}
              placeholder="Type your question…"
              suppressHydrationWarning = {true}
              className="w-full rounded-md border border-white/20 bg-black px-3 py-2 text-foreground placeholder-white/50 outline-none focus:border-white/30 focus:ring-1 focus:ring-sky-500/40"
            />
            <p className="mt-1 text-xs text-white/50">Press Ctrl/Cmd+Enter to run</p>
          </div>
        </div>

        <div className="grid grid-cols-[200px,1fr] items-start gap-3">
          <div className="text-sm text-foreground truncate whitespace-nowrap select-none">
            <span className="font-mono">answer</span>
          </div>
          <div className="min-w-0">
            <pre className="w-full whitespace-pre-wrap rounded-md border border-white/15 bg-black/60 p-3 text-sm text-foreground min-h-24 max-h-96 overflow-y-auto">
              {answer || (loading ? "…" : "")}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}