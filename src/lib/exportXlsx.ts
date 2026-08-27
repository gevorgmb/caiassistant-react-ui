import * as XLSX from "xlsx";
import type { ExportBlock, ExportDocument } from "./documentExport.ts";
import { downloadBlob, spansToPlain } from "./documentExport.ts";

function appendBlock(
  rows: string[][],
  block: ExportBlock,
): void {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
      rows.push([spansToPlain(block.spans)]);
      rows.push([]);
      break;
    case "list":
      for (const [index, item] of block.items.entries()) {
        const prefix = block.ordered ? `${index + 1}. ` : "• ";
        rows.push([prefix + spansToPlain(item)]);
      }
      rows.push([]);
      break;
    case "table":
      rows.push(block.headers);
      for (const row of block.rows) rows.push(row);
      rows.push([]);
      break;
    case "code":
      for (const line of block.text.split("\n")) rows.push([line]);
      rows.push([]);
      break;
  }
}

export async function downloadXlsx(
  doc: ExportDocument,
  filename: string,
): Promise<void> {
  const rows: string[][] = [[doc.title], []];
  for (const section of doc.sections) {
    if (section.heading) {
      rows.push([section.heading]);
      rows.push([]);
    }
    for (const block of section.blocks) {
      appendBlock(rows, block);
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [{ wch: 40 }, { wch: 40 }, { wch: 24 }, { wch: 24 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Document");
  const output = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;
  downloadBlob(
    new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
}
