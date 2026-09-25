import { NextRequest, NextResponse } from "next/server";
import { upsertRows } from "@/lib/domain/import";
import type { ImportRow } from "@/lib/types";

const EXPECTED_HEADERS: (keyof ImportRow)[] = [
  "application_id",
  "business_name",
  "borrower_name",
  "loan_amount",
  "application_date",
  "assigned_processor",
  "document_type",
  "document_status",
  "date_received",
  "expiration_date",
  "notes",
];

function parseCsv(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Partial<ImportRow> = {};
    headers.forEach((header, idx) => {
      if (EXPECTED_HEADERS.includes(header as keyof ImportRow)) {
        (row as Record<string, string>)[header] = values[idx] ?? "";
      }
    });
    rows.push(row as ImportRow);
  }

  return rows;
}

export async function POST(request: NextRequest) {
  console.log("[api/import] POST request received");

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      console.log("[api/import] no file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[api/import] processing file: ${file.name} (${file.size} bytes)`);

    const text = await file.text();
    const rows = parseCsv(text);
    console.log(`[api/import] parsed ${rows.length} rows`);

    const summary = upsertRows(rows);
    console.log("[api/import] upsert summary", summary);

    return NextResponse.json(summary);
  } catch (err) {
    console.error("[api/import] error", err);
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}
