// app/api/config/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import { parse, stringify } from "yaml";

const FILE = process.env.CONFIG_PATH || "FIRST_AID_PROJECT/configs/rag.yaml";

function isObj(x: any) { return x && typeof x === "object" && !Array.isArray(x); }
function deepMerge(a: any, b: any) {
  if (!isObj(a) || !isObj(b)) return b;
  const out: any = { ...a };
  for (const k of Object.keys(b)) out[k] = deepMerge(a[k], b[k]);
  return out;
}

export async function GET() {
  try {
    const text = await fs.readFile(FILE, "utf8").catch(() => "");
    const data = text ? parse(text) : {};
    return NextResponse.json({ path: FILE, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
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
    await fs.writeFile(FILE, stringify(next), "utf8");
    return NextResponse.json({ ok: true, mode });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
