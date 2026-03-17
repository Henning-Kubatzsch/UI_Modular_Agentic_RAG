import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 1. Pfad zur Datei definieren
    // process.cwd() ist das Root-Verzeichnis deines Projekts
    // Passe den Pfad 'Quokka/data.ts' an deinen echten Ordner an
    const filePath = path.join(process.cwd(), 'src/app/components/RAGConfigEditor2/data.ts'); 

    // 2. Den Inhalt als TypeScript-String formatieren
    const fileContent = `// Automatisch generiert
export const savedTypes = ${JSON.stringify(data, null, 2)};
`;

    // 3. Datei schreiben (überschreibt existierende Datei!)
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    return NextResponse.json({ success: true, message: 'Datei gespeichert' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Fehler beim Speichern' }, { status: 500 });
  }
}
