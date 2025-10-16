import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parseDocument, Document, isDocument } from "yaml";
import { z } from "zod";

const CONFIG_PATH = process.env.CONFIG_PATH || path.resolve(process.cwd(), "FIRST_AID_PROJECT/configs/rag.yaml");

// Zod-Schema (passe bei Bedarf an)
const RagSchema = z.object({
  llm: z.object({
    model_id: z.string(),
    decoding: z.object({
      temperature: z.number().min(0).max(2).default(0.1),
      top_p: z.number().optional(),
      max_tokens: z.number().optional(),
      repeat_penalty: z.number().optional(),
    }).partial().default({}),
  }).partial().default({}),
  retrieval: z.object({
    k_bm25: z.number().int().positive().default(50),
    k_dense: z.number().int().positive().default(50),
    k_final: z.number().int().positive().default(4),
    chunk_size: z.number().int().positive().default(900),
    chunk_overlap: z.number().int().min(0).default(120),
    min_score: z.number().default(0.26),
  }).partial().default({}),
  reranker: z.any().optional(),
  prompt: z.any().optional(),
  policy: z.any().optional(),
}).partial();

async function readText() {
  return fs.readFile(CONFIG_PATH, "utf8");
}
async function writeText(text: string) {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, text, "utf8");
}

async function backupFile() {
  try {
    const bak = CONFIG_PATH + "." + new Date().toISOString().replace(/[:.]/g, "-") + ".bak";
    await fs.copyFile(CONFIG_PATH, bak);
  } catch (_) {}
}

export async function GET() {
  try {
    const text = await readText();
    const doc = parseDocument(text); // Kommentare bleiben erhalten
    const data = doc.toJS();
    return NextResponse.json({ data, path: CONFIG_PATH });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, path: CONFIG_PATH }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const candidate = body?.data ?? {};
    const parsed = RagSchema.safeParse(candidate);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    // Original mit Kommentaren laden
    const origText = await readText();
    const doc = parseDocument(origText);

    // Sicherheits-Backup
    await backupFile();

    // Werte in YAML-Dokument mergen (flach: Top-Level-Keys)
    const next = parsed.data as Record<string, unknown>;
    Object.entries(next).forEach(([k, v]) => {
      // einfache, robuste Strategie: ersetzen/setzen
      doc.set(k, v as any);
    });

    await writeText(doc.toString()); // Kommentare bleiben weitestgehend bestehen
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
