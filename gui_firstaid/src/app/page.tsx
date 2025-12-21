"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState, useRef } from "react";
import { pruneEmpty } from "../../utils";



type AnyObj = Record<string, any>;
// fetcher gets url and makes a HTTP GET Request -> contacts a HTTP Server
// r: response object (json string) -> r.json(): parses json string to a JavaScript object
const fetcher = (url: string) => fetch(url).then((r) => r.json());
const RAG_URL = process.env.NEXT_PUBLIC_RAG_URL ?? "http://127.0.0.1:8000/rag_ui";

// -------------------- Utils --------------------@

function setAt(prevForm: AnyObj, path: string, newValue: any) {

  const keys = path.split(".");

  const nextForm = structuredClone(prevForm ?? {});

  let cur: any = nextForm;


  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];    
    if (cur[k] == null || typeof cur[k] !== "object" || Array.isArray(cur[k])) cur[k] = {};
    cur = cur[k];

  }  
  cur[keys.at(-1)!] = newValue;
  return nextForm;
}

function shallowEqual(a: any, b: any) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

// Felder-Erkennung
const ENUMS: Record<string, string[]> = {
  "llm.family": ["qwen", "qwen2", "llama3", "phi3", "mistral"],
  "prompt.language": ["en", "de"],
  "prompt.style": ["qa", "steps"],
};
const BOOL_HINT = new Set<string>([
  "llm.use_mmap",
  "llm.use_mlock",
  "prompt.cite",
  "prompt.require_citations",
]);

function flattenSection(sectionKey: string, sectionVal: any): { path: string; value: any }[] {
  const out: { path: string; value: any }[] = [];

  // iterate through key of sectionKey object: adds prefix , value data objects to out
  function walk(prefix: string, v: any) {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.keys(v).forEach((k) => walk(prefix ? `${prefix}.${k}` : k, v[k]));
    } else {
      out.push({ path: prefix, value: v });
    }
  }
  if (sectionVal !== null && typeof sectionVal === "object" && !Array.isArray(sectionVal)) {
    // if sectionVal is an object and no Array: iterate through key
    Object.keys(sectionVal).forEach((k) => walk(k, sectionVal[k]));
  // if sectionKey is no object/ an Array: push path and value to out
  } else {
    out.push({ path: sectionKey, value: sectionVal });
  }
  return out;
}

function guessType(fullPath: string, v: any): "select" | "number" | "boolean" | "text" | "multiline" {
  if (ENUMS[fullPath]) return "select";
  if (BOOL_HINT.has(fullPath) || typeof v === "boolean") return "boolean";
  if (typeof v === "number") return "number";
  if (Array.isArray(v)) return "multiline";
  if (typeof v === "string") return v.includes("\n") ? "multiline" : "text";
  if (v !== null && typeof v === "object") return "multiline";
  return "text";
}

function safeParseJSONLoose(input: string): any {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

// -------------------- AskRag --------------------
function AskRag() {
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
  // also called at unmount, all useEffect methods have an cleanup function -> when unmount all AvortController get aborted
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
      <div className="flex p-3 border-2 rounded-md text-md">
        <h1 className="">
          First Aid Instructor
        </h1>
      </div>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <h2 className="text-lg font-semibold">Ask the model (RAG)</h2>     
        <div className="flex items-center gap-2">
          {!loading ? (
            <button
              onClick={ask}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-foreground hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
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

// -------------------- Page --------------------
export default function Page() {
  // isLoading: 
  // mutate: reruns fetcher() and updates data
  // data: initialy undefined, contains data.path, data.data
  const { data, isLoading, mutate } = useSWR("/api/config", fetcher);
  const serverCfg = useMemo<AnyObj>(() => data?.data ?? {}, [data]);
  const [form, setForm] = useState<AnyObj>({});
  const [saving, setSaving] = useState<string | null>(null); // sectionKey
  const [savingAll, setSavingAll] = useState<boolean>(false);
  const originalTypes = useRef<Record<string, string>>({});


  useEffect(() => {
    if (data?.data && Object.keys(form).length === 0) {
      originalTypes.current = buildTypeMap(data.data);
      setForm(data.data);
    }
    /*
    if (data?.data && !(Object.keys(form).length === 0)) {
      originalTypes.current = buildTypeMap(data.data);
      setForm(data.data);
    }
    */
  }, [data]);


  async function reload() {
    await mutate();
  }

  // Hint: works perfectly fine
  function buildTypeMap(obj: any, prefix = ""): Record<string, string> {
    const types: Record<string, string> = {};
   
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        // Recurse into nested objects
        Object.assign(types, buildTypeMap(value, path));
      } else {
        // Store the type
        if(typeof value == 'number'){
          if (Number.isInteger(value)){
            types[path] = 'int';
          }else{
            types[path] = 'float';
          }
        }else{
          types[path] = typeof value;
        }
      }
    }    
    return types;
  }


  function fixTypes(obj: any, sectionKey: string, typeSchema: Record<string, string>) {

    // console.log(`in fixTypes sectionKey: ${sectionKey}`);

    for (const [key, value] of Object.entries(obj)) {
      const path = sectionKey ? `${sectionKey}.${key}` : key;
      //console.log(`path in fixTypes: ${path}`);
      const expectedType = typeSchema[path];
   
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        //console.log("we aren in: if (value !== null && typeof value === object && !Array.isArray(value)");
        fixTypes(value, path, typeSchema);
        continue;
      }

      if(expectedType === 'int' || expectedType === 'float'){
        const num = Number(value);       
        if(isNaN(num)){
          obj[key] = null;
        } else {
          obj[key] = expectedType === 'int' ? Math.floor(num) : num;
        }
      }
      if (expectedType === "boolean" && typeof value === "string") {
        obj[key] = value === "true";
      }      
    }
  }

  function buildSectionPayload(sectionKey: string){   

    let cloned = structuredClone(form[sectionKey]);
    fixTypes(cloned, sectionKey, originalTypes.current);
    return {[sectionKey]: cloned}
  }

  function emptyValue(sectionKey : string){    
    const section = structuredClone(form[sectionKey]);
    for (const [key, value] of Object.entries(section)){
      if (value === "" || value === undefined){
        alert(`Please leave no field empty before saving. You missed ${key}`);
        return true;
      }
    }
    return false;
  }

  // SAVE: only selected section → MERGE
  async function saveSection(sectionKey: string) {
    // setSaving: React useState hook, sets variable string saving (sectionKey) 

    console.log("originlaTypes.current in saveSection() 1: ", originalTypes.current);

    setSaving(sectionKey);
    try {
      const sectionPayload = buildSectionPayload(sectionKey);
      console.log("sectionPayload after buildSectionPayload: ", sectionPayload);
      if (emptyValue(sectionKey)){
        setSaving(null);
        return;
      } 
      const res = await fetch("/api/config?mode=merge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: sectionPayload }),
      });
      if (!res.ok) {
        // parsing error to {}
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ? JSON.stringify(j.error) : res.statusText);
      }
      await mutate();
      if(data?.data){
        setForm(data.data);
      }
    } catch (e: any) {
      alert("Error while saving: " + e.message);
    } finally {
      setSaving(null);
    }
  }



  // SAVE: complete tree → REPLACE, TODO: replace saveAllReplace as if a value field is empty the property gets deleted
  async function saveAllReplace() {
    setSavingAll(true);
    try {
      // check if there are empty fields, if so: notify the user
      for (const sectionKey in form){
        const section = form[sectionKey];
        if(!section || typeof section !== 'object') continue;
        for (const propkey in section){
          const value = section[propkey];
          if (value === undefined || value === "" || value === null){
            alert(`Please leave no field empty before saving. You missed ${propkey}`);
            setSavingAll(false);
            return;
          }
        }
      }      
      const cloned = structuredClone(form);
      fixTypes(cloned, "", originalTypes.current);

      //const cleaned = pruneEmpty(structuredClone(form)) ?? {};
      const cleaned = pruneEmpty(cloned);
      if (!cleaned || Object.keys(cleaned).length === 0) {
        setSavingAll(false);
        return;
      }
      const res = await fetch("/api/config?mode=replace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({data : cleaned})
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ? JSON.stringify(j.error) : res.statusText);
      }
      await mutate();
      if(data?.data){
        setForm(data.data);
      }
    } catch (e: any) {
      alert("Fehler beim Speichern (vollständig): " + e.message);
    } finally {
      setSavingAll(false);
    }
  }

  function onFieldChange(sectionKey: string, fieldPath: string, nextValue: any) {
    const absolutePath = `${sectionKey}.${fieldPath}`;
    setForm((prev) => setAt(prev, absolutePath, nextValue));
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-foreground">
        <div className="flex items-center gap-3 text-foreground">
          <span className="h-3 w-3 animate-pulse rounded-full bg-white/60" />
          <span>Lade Konfiguration…</span>
        </div>
      </div>
    );
  }

  const allKeys = Object.keys(form || {});

  const obj = form.llm;

  // here we can define an order how the UI elements should be listet
  const preferred = ["llm", "prompt", "retriever", "retrieval"];
  // first add elements to ordered that are in preferred, then those that are not in preferred
  const ordered = [...preferred.filter((k) => allKeys.includes(k)), ...allKeys.filter((k) => !preferred.includes(k))];

  return (
    <div className="min-h-screen background text-foreground/70">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-white/20" />
            <div>
              <h1 className="text-xl font-semibold">RAG Config Editor</h1>
              <p className="text-xs text-foreground">
               {/*Datei: <span className="font-mono">{filePath}</span>*/}
               Space for File Path
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              ⟳ Objekte & Werte neu laden
            </button>
            <button
              onClick={saveAllReplace}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-foreground hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
              disabled={savingAll}
              title="Schreibt den gesamten Formularzustand (Replace)"
            >
              {savingAll && <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />}
              Speichern (vollständig)
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-8">
        <AskRag />

        {ordered.map((sectionKey) => {      
          const sectionVal = form?.[sectionKey];
          const rows = flattenSection(sectionKey, sectionVal);
          const dirty = !shallowEqual(sectionVal, serverCfg?.[sectionKey]);

          return (
            <section key={sectionKey} className="rounded-xl border border-white/10 bg-white/[0.03] shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{sectionKey}</h2>
                  {dirty && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-foreground">ungespeichert</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setForm((prev) => setAt(prev, sectionKey, structuredClone(serverCfg?.[sectionKey])))
                    }
                    className="rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-foreground hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                    disabled={saving === sectionKey || savingAll}
                  >
                    Zurücksetzen
                  </button>
                  <button
                    onClick={() => saveSection(sectionKey)}
                    disabled={saving === sectionKey || savingAll}
                    className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-foreground hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
                    title="Speichert nur diese Section (Merge)"
                  >
                    {saving === sectionKey && <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />}
                    Speichern
                  </button>
                </div>
              </div>

              <div className="px-5 py-4">
                {/*Adjust collumn cont here*/}
                <div className="grid gap-3 lg:grid-cols-4">
                  {rows.map(({ path, value }) => (
                    <Row
                      // the key value is for react
                      key={`${sectionKey}:${path}`}
                      label={`${sectionKey}.${path}`}
                      value={value}
                      fieldType={guessType(`${sectionKey}.${path}`, value)}
                      enumValues={ENUMS[`${sectionKey}.${path}`]}
                      onChange={(prev) => onFieldChange(sectionKey, path, prev)}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

// -------------------- Row --------------------
function Row({
  label,
  value,
  fieldType,
  enumValues,
  onChange,
}: {
  label: string;
  value: any;
  fieldType: "select" | "number" | "boolean" | "text" | "multiline";
  enumValues?: string[];
  onChange: (v: any) => void;
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-3 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2">
      <div className="text-sm text-foreground truncate whitespace-nowrap" title={label}>
        <span className="font-mono">{label}</span>
      </div>

      <div className="min-w-0">
        {fieldType === "select" && enumValues ? (
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            className="w-full rounded-md border border-white/20 bg-black px-3 py-2 text-foreground placeholder-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-sky-500/40"
          >
            <option value="" className="bg-black text-foreground">
              — auswählen —
            </option>
            {enumValues.map((opt) => (
              <option key={opt} value={opt} className="bg-black text-foreground">
                {opt}
              </option>
            ))}
          </select>
        ) : fieldType === "boolean" ? (
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-black text-sky-500 focus:ring-sky-500/40"
            />
            <span className="text-sm text-foreground">{value ? "true" : "false"}</span>
          </label>
        ) : fieldType === "number" ? (
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") return onChange(undefined);
              const n = Number(raw);
              onChange(Number.isNaN(n) ? undefined : n);
            }}
            className="w-full rounded-md border border-white/20 bg-black px-3 py-2 text-foreground placeholder-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-sky-500/40"
          />
        ) : fieldType === "multiline" ? (
          <textarea
            value={
              Array.isArray(value)
                ? JSON.stringify(value, null, 2)
                : typeof value === "object" && value !== null
                ? JSON.stringify(value, null, 2)
                : value ?? ""
            }
            onChange={(e) => onChange(safeParseJSONLoose(e.target.value))}
            className="h-28 w-full rounded-md border border-white/20 bg-black px-3 py-2 font-mono text-sm text-foreground placeholder-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-sky-500/40"
            spellCheck={false}
          />
        ) : (
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
            className="w-full rounded-md border border-white/20 bg-black px-3 py-2 text-foreground placeholder-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-sky-500/40"
            placeholder="Wert eingeben…"
          />
        )}
      </div>
    </div>
  );
}
