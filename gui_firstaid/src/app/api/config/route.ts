// app/api/config/route.ts
import { NextResponse } from "next/server";
// allows async and await for data operations -> only runs on server side (not in Browser)
// fs: Node file system
import fs from "fs/promises";
// create js objects from yaml format (parse) and create strings from js objects (stringify)
import { parse, stringify } from "yaml";

const FILE = process.env.CONFIG_PATH || "FIRST_AID_PROJECT/configs/rag.yaml";

function isObj(x: any) { return x && typeof x === "object" && !Array.isArray(x); }

function deepMerge(a: any, b: any) {
  if (!isObj(a) || !isObj(b)) return b;
  // creates flat copy using the spread operator (avoids mutation of the original value)
  const out: any = { ...a };
  for (const k of Object.keys(b)) out[k] = deepMerge(a[k], b[k]);
  return out;
}

// export GET method: Next.js App Router Convention
export async function GET() {
  //console.log("we are in route.ts")
  try {
    // could i also use fetch API here?
    const text = await fs.readFile(FILE, "utf8").catch(() => "");
    // translates yaml file (string) into a js data object if exists, else: return {}
    const data = text ? parse(text) : {};
    // serialization into json string, body: json string
    return NextResponse.json({ path: FILE, data });
    // try: return new Response(JSON.)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    // parse req, if error -> return {}
    const body = await req.json().catch(() => ({}));
    const incoming = body?.data ?? {};
    console.log("incoming:", incoming)

    const url = new URL(req.url);
    //tries to get mode, default is merge, "merge" | "replace" works as assertion
    const mode = (url.searchParams.get("mode") || "merge") as "merge" | "replace";

    // here we load data from .yaml file
    const curText = await fs.readFile(FILE, "utf8").catch(() => "");
    // parse: translates yaml data file into data object if it exists
    const current = curText ? parse(curText) : {};

    // is replace set at any time? if not it would mean we use merge all the time.
    const next = mode === "replace" ? incoming : deepMerge(current, incoming);
    await fs.writeFile(FILE, stringify(next), "utf8");
    return NextResponse.json({ ok: true, mode });
  } 
  catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
