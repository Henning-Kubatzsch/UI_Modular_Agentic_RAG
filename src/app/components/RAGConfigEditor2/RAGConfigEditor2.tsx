"use client"
import { useEffect, useState, useRef, useMemo } from "react"
import useSWR from "swr";
import {pruneEmpty} from "../../../../utils"
import { init } from "next/dist/compiled/webpack/webpack";



type AnyObj = Record<string, any>
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function setAt(prevForm: AnyObj, path: string, newValue: any) {

  const keys = path.split(".");
  const newForm = structuredClone(prevForm ?? {});
  let current = newForm;
 
  for (const key of keys.slice(0, -1)){
    current[key] ??= {};
    current = current[key]
  }
  current[keys.at(-1)!] = newValue; 
  return newForm;
}

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

function shallowEqual(a: any, b: any) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

function safeParseJSONLoose(input: string): any {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

export default function RAGConfigEditor(){
  
    const { data: configData, isLoading: configLoading, mutate } = useSWR("/api/config", fetcher);
    const { data: schemaData, isLoading: schemaLoading} = useSWR("/api/config?type=schema", fetcher);
    const serverCfg = useMemo<AnyObj>(() => configData?.configData ?? {}, [configData]);
    const [form, setForm] = useState<AnyObj>({});
    const [saving, setSaving] = useState<string | null>(null); // sectionKey
    const [savingAll, setSavingAll] = useState<boolean>(false);
    const originalTypes = useRef<Record<string, string>>({});
    const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if(schemaData?.data && Object.keys(expandedSection).length == 0){
            const initialExpanded : Record<string, boolean> = {}
            for (const key in schemaData.data){
                initialExpanded[key] = true;
            }
            setExpandedSection(initialExpanded)
        }
    }, [schemaData])
        
    useEffect(() => {
        if (configData?.data && Object.keys(form).length === 0) {
            originalTypes.current = buildTypeMap(configData.data);
            setForm(configData.data);
        }
        else if (configData?.data){   
            setForm(configData.data);
        }
        for(const [key, value] of Object.entries(expandedSection)){
        }
    }, [configData]);
 

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


    function fixTypes2(){};


  function fixTypes(obj: any, sectionKey: string, typeSchema: Record<string, string>): any {
    
    for (const [key, value] of Object.entries(obj)) {
      const path = sectionKey ? `${sectionKey}.${key}` : key;
      const expectedType = typeSchema[path];
   
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
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
    const formCopy = structuredClone(form);
    formCopy[sectionKey] = obj
    setForm(formCopy)

    return obj
  }

  function buildSectionPayload(sectionKey: string){   

    const cleaned = fixTypes(structuredClone(form[sectionKey]), sectionKey, originalTypes.current);
    return {[sectionKey]: cleaned}
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

    setSaving(sectionKey);
    try {
      const sectionPayload = buildSectionPayload(sectionKey);
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
      const cleaned = fixTypes(structuredClone(form), "", originalTypes.current);

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
    } catch (e: any) {
      alert("Error with saving (completly): " + e.message);
    } finally {
      setSavingAll(false);
    }
  }

  function onFieldChange(sectionKey: string, fieldPath: string, nextValue: any) {
    const absolutePath = `${sectionKey}.${fieldPath}`;
    
    setForm((prev) => setAt(prev, absolutePath, nextValue));
  }

  const saveTypesToFile = async () => {
      try {
          const response = await fetch('/api/save-types', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              // Hier senden wir den aktuellen Inhalt des Refs
              body: JSON.stringify(originalTypes.current),
          });

          if (response.ok) {
              console.log("Erfolgreich gespeichert!");
          } else {
              console.error("Fehler beim Speichern");
          }
      } catch (e) {
          console.error("Netzwerkfehler", e);
      }
  };

  
  const ExpandSection = (sectionKey: string) => {
    setExpandedSection(prev => {
      const newState = {...prev};
      newState[sectionKey] = !newState[sectionKey];
      return newState;
    }

    )
  }


  if (configLoading) {
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
  
    return(
        <section className="rounded-xl border border-white/10 bg-white/[0.03] ">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <button onClick={saveTypesToFile}>Typen speichern</button>
            </div>

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <h2 className="text-lg font-semibold">RAG Config Editor</h2>     
                <div className="flex items-center gap-2">
                    <button
                        onClick={reload}
                        className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm font-medium text-foreground hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                        >
                        Reload objects & values
                    </button>
                    <button
                        onClick={saveAllReplace}
                        className="inline-flex items-center gap-2 rounded-md bg-[var(--button_top)] px-3 py-2 text-sm font-medium text-foreground hover:bg-[var(--button_top_hover)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-60"
                        disabled={savingAll}
                        title="Schreibt den gesamten Formularzustand (Replace)"
                        >
                        {savingAll && <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />}
                        Save (completely)
                    </button>
                </div>
            </div>
                    {ordered.map((sectionKey) => {      
          const sectionVal = form?.[sectionKey];
          const rows = flattenSection(sectionKey, sectionVal);
          const dirty = !shallowEqual(sectionVal, serverCfg?.[sectionKey]);          
         

          return (
            <section key={sectionKey} className="border border-white/10 bg-white/[0.03] shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{sectionKey}</h2>
                  {dirty && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-foreground">unsaved</span>}
                </div>                
                <div className="flex items-center gap-2">
                {expandedSection[sectionKey] && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                            setForm((prev) => setAt(prev, sectionKey, structuredClone(serverCfg?.[sectionKey])))
                            }
                            className="rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm text-foreground hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                            disabled={saving === sectionKey || savingAll}
                        >
                            Undo                            
                        </button>
                        <button
                            onClick={() => saveSection(sectionKey)}
                            disabled={saving === sectionKey || savingAll}
                            className="inline-flex items-center gap-2 rounded-md bg-[var(--button_standard)] px-4 py-2 text-sm font-medium text-foreground hover:bg-[var(--button_standard_hover)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
                            title="Speichert nur diese Section (Merge)"
                        >
                            {saving === sectionKey && <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />}
                            Save
                        </button>
                    </div>
                )}
                  <button
                    onClick={() => ExpandSection(sectionKey)}
                    className="inline-flex items-center gap-2 rounded-md bg-[var(--background)] px-4 py-2 text-sm font-medium text-foreground hover:bg-[var(--button_standard_hover)] focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:opacity-60"
                    title="Toggel Expand Mode"
                  >
                    <span>{expandedSection[sectionKey] ? "▾" : "▸"}</span>
                  </button>
                  
                </div>
                    
              </div>

              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                expandedSection[sectionKey]
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}>
                <div className="px-5 py-4">
                {/*Adjust collumn count here*/}
                  <div className="grid gap-2 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
                    {rows.map(({ path, value }) => {
                      const fieldDef = schemaData.data[sectionKey]?.properties?.[path];
                      const hasEnum = Array.isArray(fieldDef?.enum) && fieldDef.enum.length > 0;
                      
                      return(
                      <Row
                        // the key value is for react
                        key={`${sectionKey}:${path}`}
                        label={`${path}`}
                        value={value}

                        fieldType={hasEnum ? "select" : fieldDef?.type}
                        enumValues={fieldDef?.enum}
                        onChange={(prev) => onFieldChange(sectionKey, path, prev)}
                      />);
                    })}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
            
        </section>
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