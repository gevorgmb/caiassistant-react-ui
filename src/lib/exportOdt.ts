import JSZip from "jszip";
import type { ExportBlock, ExportDocument, InlineSpan } from "./documentExport.ts";
import { downloadBlob } from "./documentExport.ts";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function spansToXml(spans: InlineSpan[]): string {
  return spans
    .map((span) => {
      let text = xmlEscape(span.text).replace(/\n/g, "<text:line-break/>");
      const styles: string[] = [];
      if (span.bold) styles.push("Tbold");
      if (span.italic) styles.push("Titalic");
      if (span.code) styles.push("Tcode");
      for (const style of styles) {
        text = `<text:span text:style-name="${style}">${text}</text:span>`;
      }
      return text;
    })
    .join("");
}

function paragraphXml(spans: InlineSpan[], style?: string): string {
  const styleAttr = style ? ` text:style-name="${style}"` : "";
  return `<text:p${styleAttr}>${spansToXml(spans)}</text:p>`;
}

function headingXml(level: 1 | 2 | 3, spans: InlineSpan[]): string {
  return `<text:h text:style-name="Heading_20_${level}" text:outline-level="${level}">${spansToXml(spans)}</text:h>`;
}

function tableXml(block: Extract<ExportBlock, { type: "table" }>, name: string): string {
  const columnCount = Math.max(
    1,
    block.headers.length,
    ...block.rows.map((row) => row.length),
  );
  const cell = (text: string): string =>
    `<table:table-cell office:value-type="string"><text:p>${xmlEscape(text)}</text:p></table:table-cell>`;
  const pad = (row: string[]): string[] => {
    const next = row.slice();
    while (next.length < columnCount) next.push("");
    return next;
  };
  const headerRow = `<table:table-row>${pad(block.headers).map(cell).join("")}</table:table-row>`;
  const bodyRows = block.rows
    .map((row) => `<table:table-row>${pad(row).map(cell).join("")}</table:table-row>`)
    .join("");
  return [
    `<table:table table:name="${xmlEscape(name)}">`,
    `<table:table-column table:number-columns-repeated="${columnCount}"/>`,
    `<table:table-header-rows>${headerRow}</table:table-header-rows>`,
    bodyRows,
    `</table:table>`,
  ].join("");
}

function blocksToXml(blocks: ExportBlock[], tablePrefix: string): string {
  let tableIndex = 0;
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return headingXml(block.level, block.spans);
        case "paragraph":
          return paragraphXml(block.spans);
        case "quote":
          return paragraphXml(block.spans, "Quote");
        case "list":
          return block.items
            .map((item, index) => {
              const prefix = block.ordered ? `${index + 1}. ` : "• ";
              return paragraphXml([{ text: prefix }, ...item]);
            })
            .join("");
        case "table":
          tableIndex += 1;
          return tableXml(block, `${tablePrefix}${tableIndex}`);
        case "code":
          return paragraphXml([{ text: block.text, code: true }], "Preformatted");
      }
    })
    .join("");
}

function contentXml(doc: ExportDocument): string {
  const sections = [
    headingXml(1, [{ text: doc.title, bold: true }]),
    ...doc.sections.map((section, index) => {
      const heading = section.heading
        ? headingXml(2, [{ text: section.heading, bold: true }])
        : "";
      return heading + blocksToXml(section.blocks, `Table${index + 1}-`);
    }),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.3">
  <office:automatic-styles>
    <style:style style:name="Tbold" style:family="text">
      <style:text-properties fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Titalic" style:family="text">
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Tcode" style:family="text">
      <style:text-properties style:font-name="Liberation Mono" fo:font-family="&apos;Liberation Mono&apos;" fo:font-size="10pt"/>
    </style:style>
  </office:automatic-styles>
  <office:body>
    <office:text>${sections}</office:text>
  </office:body>
</office:document-content>`;
}

function stylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  office:version="1.3">
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph">
      <style:text-properties fo:font-size="12pt"/>
    </style:style>
    <style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="18pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Heading_20_2" style:display-name="Heading 2" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="16pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Heading_20_3" style:display-name="Heading 3" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="14pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Quote" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-left="0.5in"/>
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Preformatted" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties style:font-name="Liberation Mono" fo:font-family="&apos;Liberation Mono&apos;" fo:font-size="10pt"/>
    </style:style>
  </office:styles>
</office:document-styles>`;
}

function metaXml(title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  office:version="1.3">
  <office:meta>
    <dc:title>${xmlEscape(title)}</dc:title>
    <meta:generator>Clerk AI Assistant</meta:generator>
  </office:meta>
</office:document-meta>`;
}

function manifestXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;
}

export async function downloadOdt(
  doc: ExportDocument,
  filename: string,
): Promise<void> {
  const zip = new JSZip();
  zip.file("mimetype", "application/vnd.oasis.opendocument.text", {
    compression: "STORE",
  });
  zip.file("META-INF/manifest.xml", manifestXml());
  zip.file("content.xml", contentXml(doc));
  zip.file("styles.xml", stylesXml());
  zip.file("meta.xml", metaXml(doc.title));
  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.oasis.opendocument.text",
    compression: "DEFLATE",
  });
  downloadBlob(blob, filename);
}
