import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
} from "docx";
import type { ExportBlock, ExportDocument, InlineSpan } from "./documentExport.ts";
import { downloadBlob } from "./documentExport.ts";

const HEADING_LEVEL = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
} as const;

function runsFromSpans(spans: InlineSpan[]): TextRun[] {
  const runs = spans
    .filter((span) => span.text.length > 0)
    .map(
      (span) =>
        new TextRun({
          text: span.text,
          bold: span.bold,
          italics: span.italic,
          font: span.code ? "Courier New" : undefined,
        }),
    );
  return runs.length > 0 ? runs : [new TextRun("")];
}

function paragraphFromSpans(
  spans: InlineSpan[],
  options: IParagraphOptions = {},
): Paragraph {
  return new Paragraph({
    ...options,
    children: runsFromSpans(spans),
  });
}

function tableFromBlock(block: Extract<ExportBlock, { type: "table" }>): Table {
  const rows = [block.headers, ...block.rows];
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: Array.from({ length: columnCount }, (_, index) => {
            const text = row[index] ?? "";
            return new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      bold: rowIndex === 0,
                    }),
                  ],
                }),
              ],
            });
          }),
        }),
    ),
  });
}

function blocksToChildren(blocks: ExportBlock[]): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        children.push(
          paragraphFromSpans(block.spans, {
            heading: HEADING_LEVEL[block.level],
            spacing: { after: 160 },
          }),
        );
        break;
      case "paragraph":
        children.push(
          paragraphFromSpans(block.spans, { spacing: { after: 160 } }),
        );
        break;
      case "quote":
        children.push(
          paragraphFromSpans(
            block.spans.map((span) => ({ ...span, italic: true })),
            {
              indent: { left: 360 },
              spacing: { after: 160 },
            },
          ),
        );
        break;
      case "list":
        for (const item of block.items) {
          children.push(
            paragraphFromSpans(
              item,
              block.ordered
                ? {
                    numbering: { reference: "export-numbers", level: 0 },
                    spacing: { after: 80 },
                  }
                : {
                    bullet: { level: 0 },
                    spacing: { after: 80 },
                  },
            ),
          );
        }
        break;
      case "table":
        children.push(tableFromBlock(block));
        children.push(new Paragraph({ text: "" }));
        break;
      case "code":
        children.push(
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: block.text,
                font: "Courier New",
              }),
            ],
          }),
        );
        break;
    }
  }
  return children;
}

export async function downloadDocx(
  doc: ExportDocument,
  filename: string,
): Promise<void> {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: 280 },
      children: [new TextRun(doc.title)],
    }),
  ];

  for (const section of doc.sections) {
    if (section.heading) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 },
          children: [new TextRun(section.heading)],
        }),
      );
    }
    children.push(...blocksToChildren(section.blocks));
  }

  const document = new Document({
    numbering: {
      config: [
        {
          reference: "export-numbers",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: "start",
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  downloadBlob(await Packer.toBlob(document), filename);
}
