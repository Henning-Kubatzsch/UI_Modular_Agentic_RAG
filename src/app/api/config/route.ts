// app/api/config/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import { parse, stringify } from "yaml";

const FILE = process.env.CONFIG_PATH || "AGENTIC_RAG_CONFIG/configs/rag.yaml";
const BACKEND_URL = "http://127.0.0.1:8000";

const BACKEND_URL_1 = "http://127.0.0.1:8000/get_config";
const BACKEND_URL_2 = "http://127.0.0.1:8000/config";




function isObj(x: any) { return x && typeof x === "object" && !Array.isArray(x); }
function deepMerge(a: any, b: any) {
  if (!isObj(a) || !isObj(b)) return b;
  const out: any = { ...a };
  for (const k of Object.keys(b)) out[k] = deepMerge(a[k], b[k]); 
  return out;
}

export async function GET(request: Request) {

  const {searchParams} = new URL(request.url);
  const type = searchParams.get("type");

  if (type == "schema"){
      try {
        const res = await fetch
        (`${BACKEND_URL}/config`, 
          {
            method:"GET",
            cache: "no-store"
          }
        );
    
        if (!res.ok){
          throw new Error(`Backend not responding with status ${res.status}`);
        }
        const configFromPython = await res.json();
        console.log("we received schema from backend");
        return NextResponse.json({
          source: "python-backend",
          data: configFromPython
        });
      } catch (e: any) {
        console.error("Error while loading from backend:", e);
        return NextResponse.json(
          { error: e.message }, 
          { status: 500 });
      }    
  }else{
    try {
      const res = await fetch
      (`${BACKEND_URL}/get_config`, 
        {
          method:"GET",
          cache: "no-store"
        }
      );
      
      if (!res.ok){
        throw new Error(`Backend not responding with status ${res.status}`);
      }
      const configFromPython = await res.json();
      console.log("we received config from backend");
      return NextResponse.json({
        source: "python-backend",
        data: configFromPython
      });
    } catch (e: any) {
      console.error("Error while loading from backend:", e);
      return NextResponse.json(
        { error: e.message }, 
        { status: 500 });
    }
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const incoming = body?.data ?? {};
    const url = new URL(req.url);
    const mode = (url.searchParams.get("mode") || "merge") as "merge" | "replace";

    const curText = await fs.readFile(FILE, "utf8").catch(() => "");
    const current = curText ? parse(curText) : {};

    const next = mode === "replace" ? incoming : deepMerge(current, incoming);

    const response = await fetch(`${BACKEND_URL}/save_config`,{
      method : "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(incoming)
    })

    //await fs.writeFile(FILE, stringify(next), "utf8");
    return NextResponse.json({ ok: true, mode });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
