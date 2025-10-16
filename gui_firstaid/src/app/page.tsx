"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type AnyObj = Record<string, any>;
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// -------------------- Utils --------------------
function getAt(obj: AnyObj, path: string) {
  return path.split(".").reduce((acc: any, k) => (acc != null ? acc[k] : undefined), obj);
}
function setAt(obj: AnyObj, path: string, value: any) {
  const keys = path.split(".");
  const next = structuredClone(obj ?? {});
  let cur: any = next;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== "object") cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys.at(-1)!] = value;
  return next;
}
function shallowEqual(a: any, b: any) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

const ENUMS: Record<string, string[]> = {
  "llm.family": ["qwen", "qwen2", "llama3", "phi3", "mistral"],
  "prompt.language": ["en", "de"],
  "prompt.style": ["qa", "steps"],
};
const BOOL_HINT = new Set<string>(["llm.use_mmap", "llm.use_mlock", "prompt.cite", "prompt.require_citations"]);

function flattenSection(sectionKey: string, sectionVal: any): { path: string; value: any }[] {
  const out: { path: string; value: any }[] = [];
  function walk(prefix: string, v: any) {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.keys(v).forEach((k) => walk(prefix ? `${prefix}.${k}` : k, v[k]));
    } else {
      out.push({ path: prefix, value: v });
    }
  }
  if (sectionVal !== null && typeof sectionVal === "object" && !Array.isArray(sectionVal)) {
    Object.keys(sectionVal).forEach((k) => walk(k, sectionVal[k]));
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
  if (typeof v === "string") return (v.includes("\n") ? "multiline" : "text");
  if (v !== null && typeof v === "object") return "multiline";
  return "text";
}

// -------------------- Page --------------------
export default function Page() {
  const { data, isLoading, mutate } = useSWR("/api/config", fetcher);
  const serverCfg = useMemo<AnyObj>(() => data?.data ?? {}, [data]);
  const [form, setForm] = useState<AnyObj>({});
  const [saving, setSaving] = useState<string | null>(null); // sectionKey

  useEffect(() => {
    if (!isLoading && data?.data) setForm(data.data);
  }, [isLoading, data]);

  async function reload() {
    await mutate();
  }

  async function saveSection(sectionKey: string) {
    setSaving(sectionKey);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ? JSON.stringify(j.error) : res.statusText);
      }
      await mutate();
    } catch (e: any) {
      alert("Fehler beim Speichern: " + e.message);
    } finally {
      setSaving(null);
    }
  }

  function onFieldChange(sectionKey: string, fieldPath: string, nextValue: any) {
    const absolutePath = `${sectionKey}.${fieldPath}`;
    setForm((prev) => setAt(prev, absolutePath, nextValue));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 text-white/80">
          <span className="h-3 w-3 animate-pulse rounded-full bg-white/60" />
          <span>Lade Konfiguration…</span>
        </div>
      </div>
    );
  }

  const filePath = data?.path ?? "";
  const allKeys = Object.keys(form || {});
  const preferred = ["llm", "prompt", "retriever", "retrieval"];
  const ordered = [...preferred.filter((k) => allKeys.includes(k)), ...allKeys.filter((k) => !preferred.includes(k))];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-white/20" />
            <div>
              <h1 className="text-xl font-semibold">RAG Config Editor</h1>
              <p className="text-xs text-white/70">
                Datei: <span className="font-mono">{filePath}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              ⟳ Objekte & Werte neu laden
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 space-y-8">
        {/*
        <div className="rounded-lg border border-white/10 bg-white/5 text-white px-4 py-3 text-sm">
          • Zweispaltiges Layout ab großer Breite • Links in jeder Zelle: Param-Name • Rechts: Eingabefeld • Speichern pro Section.
        </div>
        */}

        {ordered.map((sectionKey) => {
          const sectionVal = form?.[sectionKey];
          const rows = flattenSection(sectionKey, sectionVal);
          const dirty = !shallowEqual(sectionVal, serverCfg?.[sectionKey]);

          return (
            <section key={sectionKey} className="rounded-xl border border-white/10 bg-white/[0.03] shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{sectionKey}</h2>
                  {dirty && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">ungespeichert</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setForm((prev) => setAt(prev, sectionKey, serverCfg?.[sectionKey]))}
                    className="rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                    disabled={saving === sectionKey}
                  >
                    Zurücksetzen
                  </button>
                  <button
                    onClick={() => saveSection(sectionKey)}
                    disabled={saving === sectionKey}
                    className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
                  >
                    {saving === sectionKey && <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />}
                    Speichern
                  </button>
                </div>
              </div>

              <div className="px-5 py-4">
                {/* NEU: 2 Spalten ab lg */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {rows.map(({ path, value }) => (
                    <Row
                      key={`${sectionKey}:${path}`}
                      label={`${sectionKey}.${path}`}
                      value={value}
                      fieldType={guessType(`${sectionKey}.${path}`, value)}
                      enumValues={ENUMS[`${sectionKey}.${path}`]}
                      onChange={(nv) => onFieldChange(sectionKey, path, nv)}
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
    <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] items-center gap-3 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2">
      {/* Parametername (read-only) */}
      <div className="text-sm text-white/80 truncate" title={label}>
        <span className="font-mono">{label}</span>
      </div>

      {/* Eingabefeld */}
      <div>
        {fieldType === "select" && enumValues ? (
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-black px-3 py-2 text-white placeholder-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-sky-500/40"
          >
            {enumValues.map((opt) => (
              <option key={opt} value={opt} className="bg-black text-white">
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
            <span className="text-sm text-white/80">{value ? "true" : "false"}</span>
          </label>
        ) : fieldType === "number" ? (
          <input
            type="number"
            value={Number.isFinite(value) ? value : value === "" ? "" : ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") return onChange(undefined);
              const n = Number(raw);
              onChange(Number.isNaN(n) ? undefined : n);
            }}
            className="w-full rounded-md border border-white/20 bg-black px-3 py-2 text-white placeholder-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-sky-500/40"
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
            onChange={(e) => {
              const t = e.target.value;
              try {
                const parsed = JSON.parse(t);
                onChange(parsed);
              } catch {
                onChange(t);
              }
            }}
            className="h-28 w-full rounded-md border border-white/20 bg-black px-3 py-2 font-mono text-sm text-white placeholder-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-sky-500/40"
            spellCheck={false}
          />
        ) : (
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-black px-3 py-2 text-white placeholder-white/50 outline-none focus:border-white/30 focus:ring-2 focus:ring-sky-500/40"
            placeholder="Wert eingeben…"
          />
        )}
      </div>
    </div>
  );
}
