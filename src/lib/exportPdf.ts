import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { ExportDocument, InlineSpan } from "./documentExport.ts";
import { downloadBlob } from "./documentExport.ts";

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function spansToHtml(spans: InlineSpan[]): string {
  return spans
    .map((span) => {
      let text = htmlEscape(span.text).replace(/\n/g, "<br />");
      if (span.code) text = `<code>${text}</code>`;
      if (span.bold) text = `<strong>${text}</strong>`;
      if (span.italic) text = `<em>${text}</em>`;
      return text;
    })
    .join("");
}

function documentToHtml(doc: ExportDocument): string {
  const parts: string[] = [`<h1>${htmlEscape(doc.title)}</h1>`];
  for (const section of doc.sections) {
    if (section.heading) {
      parts.push(`<h2>${htmlEscape(section.heading)}</h2>`);
    }
    for (const block of section.blocks) {
      switch (block.type) {
        case "heading": {
          const tag = `h${block.level + 1}`;
          parts.push(`<${tag}>${spansToHtml(block.spans)}</${tag}>`);
          break;
        }
        case "paragraph":
          parts.push(`<p>${spansToHtml(block.spans)}</p>`);
          break;
        case "quote":
          parts.push(`<blockquote>${spansToHtml(block.spans)}</blockquote>`);
          break;
        case "list": {
          const tag = block.ordered ? "ol" : "ul";
          const items = block.items
            .map((item) => `<li>${spansToHtml(item)}</li>`)
            .join("");
          parts.push(`<${tag}>${items}</${tag}>`);
          break;
        }
        case "table": {
          const head = block.headers
            .map((cell) => `<th>${htmlEscape(cell)}</th>`)
            .join("");
          const body = block.rows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${htmlEscape(cell)}</td>`).join("")}</tr>`,
            )
            .join("");
          parts.push(
            `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
          );
          break;
        }
        case "code":
          parts.push(`<pre><code>${htmlEscape(block.text)}</code></pre>`);
          break;
      }
    }
  }
  return parts.join("");
}

function sliceCanvas(
  source: HTMLCanvasElement,
  startY: number,
  height: number,
): HTMLCanvasElement {
  const slice = document.createElement("canvas");
  const sliceHeight = Math.max(1, Math.min(height, source.height - startY));
  slice.width = source.width;
  slice.height = sliceHeight;
  const context = slice.getContext("2d");
  if (context) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(
      source,
      0,
      startY,
      source.width,
      sliceHeight,
      0,
      0,
      source.width,
      sliceHeight,
    );
  }
  return slice;
}

export async function downloadPdf(
  doc: ExportDocument,
  filename: string,
): Promise<void> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:800px",
    "padding:24px 32px",
    "background:#ffffff",
    "color:#132029",
    "font:16px/1.55 'IBM Plex Sans','IBM Plex Sans Armenian',sans-serif",
    "z-index:-1",
    "pointer-events:none",
  ].join(";");
  host.innerHTML = [
    "<style>",
    "h1{font-size:22px;margin:0 0 16px}",
    "h2{font-size:18px;margin:20px 0 8px}",
    "h3,h4{font-size:16px;margin:16px 0 8px}",
    "p,blockquote,ul,ol,table,pre{margin:0 0 12px}",
    "ul,ol{padding-left:22px}",
    "blockquote{border-left:3px solid #c5d4cc;padding:4px 12px;color:#4a5560}",
    "table{border-collapse:collapse;width:100%;font-size:14px}",
    "th,td{border:1px solid #d7ddd8;padding:6px 8px;text-align:left;vertical-align:top}",
    "th{background:#eef3ef}",
    "pre,code{font-family:'IBM Plex Mono',monospace}",
    "pre{background:#e8ece8;padding:10px 12px;white-space:pre-wrap}",
    "</style>",
    documentToHtml(doc),
  ].join("");
  document.body.append(host);

  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;
    const pagePixelHeight = Math.max(
      1,
      Math.round((usableHeight / usableWidth) * canvas.width),
    );

    let startY = 0;
    let page = 0;
    while (startY < canvas.height) {
      const slice = sliceCanvas(canvas, startY, pagePixelHeight);
      if (page > 0) pdf.addPage();
      const sliceHeightMm = (slice.height * usableWidth) / slice.width;
      pdf.addImage(
        slice.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        usableWidth,
        sliceHeightMm,
      );
      startY += pagePixelHeight;
      page += 1;
    }

    downloadBlob(pdf.output("blob"), filename);
  } finally {
    host.remove();
  }
}
