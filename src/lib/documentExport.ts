import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type {
  Content,
  ListItem,
  PhrasingContent,
  Root,
  Table,
} from "mdast";
import type { Messages } from "../i18n/types.ts";
import type { AssistantResult } from "./generatedDocuments.ts";

export type ExportFormat = "pdf" | "docx" | "odt" | "xlsx";

export const EXPORT_FORMATS: ExportFormat[] = ["pdf", "docx", "odt", "xlsx"];

export type InlineSpan = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

export type ExportBlock =
  | { type: "heading"; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { type: "paragraph"; spans: InlineSpan[] }
  | { type: "quote"; spans: InlineSpan[] }
  | { type: "list"; ordered: boolean; items: InlineSpan[][] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; text: string };

export type ExportSection = {
  heading?: string;
  blocks: ExportBlock[];
};

export type ExportDocument = {
  title: string;
  sections: ExportSection[];
};

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned || "generated-document";
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function spansToPlain(spans: InlineSpan[]): string {
  return spans.map((span) => span.text).join("");
}

export function parseMarkdown(markdown: string): ExportBlock[] {
  const text = markdown.trim();
  if (!text) return [];
  const tree = unified().use(remarkParse).use(remarkGfm).parse(text) as Root;
  return tree.children.flatMap(contentToBlocks);
}

export function resultToExportDocument(
  result: AssistantResult,
  t: Messages,
  fallbackTitle: string,
): ExportDocument {
  switch (result.kind) {
    case "document":
      return {
        title: fallbackTitle,
        sections: [{ blocks: parseMarkdown(result.content) }],
      };
    case "check":
      return {
        title: t.assistant.review,
        sections: [
          { blocks: parseMarkdown(result.summary) },
          {
            heading: t.assistant.review,
            blocks:
              result.issues.length === 0
                ? [
                    {
                      type: "paragraph",
                      spans: [{ text: t.assistant.noIssues }],
                    },
                  ]
                : [
                    {
                      type: "table",
                      headers: [
                        t.assistant.severity,
                        t.assistant.message,
                        t.assistant.suggestion,
                      ],
                      rows: result.issues.map((issue) => [
                        issue.severity,
                        issue.message,
                        issue.suggestion ?? "",
                      ]),
                    },
                  ],
          },
          ...(result.revisedDocument
            ? [
                {
                  heading: t.assistant.revisedDocument,
                  blocks: parseMarkdown(result.revisedDocument),
                },
              ]
            : []),
        ],
      };
    case "agenda":
      return {
        title: result.title || t.assistant.agenda,
        sections: [
          ...(result.items.length > 0
            ? [
                {
                  blocks: [
                    {
                      type: "table" as const,
                      headers: [
                        t.assistant.item,
                        t.assistant.description,
                        t.assistant.minutes,
                      ],
                      rows: result.items.map((item) => [
                        item.title,
                        item.description ?? "",
                        item.durationMinutes == null
                          ? ""
                          : String(item.durationMinutes),
                      ]),
                    },
                  ],
                },
              ]
            : []),
          { blocks: parseMarkdown(result.markdown) },
        ],
      };
    case "report":
      return {
        title: result.title || t.assistant.report,
        sections: [
          { blocks: parseMarkdown(result.summary) },
          { blocks: parseMarkdown(result.markdown) },
        ],
      };
  }
}

function contentToBlocks(node: Content): ExportBlock[] {
  switch (node.type) {
    case "heading": {
      const level = Math.min(Math.max(node.depth, 1), 3) as 1 | 2 | 3;
      return [{ type: "heading", level, spans: phrasingToSpans(node.children) }];
    }
    case "paragraph":
      return [{ type: "paragraph", spans: phrasingToSpans(node.children) }];
    case "blockquote":
      return node.children.flatMap(contentToBlocks).map((block) =>
        block.type === "paragraph"
          ? { type: "quote" as const, spans: block.spans }
          : block,
      );
    case "list":
      return [
        {
          type: "list",
          ordered: node.ordered === true,
          items: node.children.map(listItemToSpans),
        },
      ];
    case "table":
      return [tableToBlock(node)];
    case "code":
      return [{ type: "code", text: node.value }];
    case "thematicBreak":
      return [{ type: "paragraph", spans: [{ text: "—" }] }];
    default:
      if ("children" in node && Array.isArray(node.children)) {
        return (node.children as Content[]).flatMap(contentToBlocks);
      }
      return [];
  }
}

function tableToBlock(table: Table): ExportBlock {
  const rows = table.children.map((row) =>
    row.children.map((cell) =>
      phrasingToPlain(cell.children as PhrasingContent[]),
    ),
  );
  return {
    type: "table",
    headers: rows[0] ?? [],
    rows: rows.slice(1),
  };
}

function listItemToSpans(item: ListItem): InlineSpan[] {
  const spans: InlineSpan[] = [];
  for (const child of item.children) {
    if (child.type === "paragraph") {
      if (spans.length > 0) spans.push({ text: " " });
      spans.push(...phrasingToSpans(child.children));
    } else if (child.type === "list") {
      const nested = child.children
        .map(listItemToSpans)
        .map(spansToPlain)
        .filter(Boolean)
        .join("; ");
      if (nested) {
        if (spans.length > 0) spans.push({ text: " " });
        spans.push({ text: `(${nested})` });
      }
    }
  }
  return spans.length > 0 ? spans : [{ text: "" }];
}

function phrasingToSpans(
  nodes: PhrasingContent[],
  marks: Pick<InlineSpan, "bold" | "italic" | "code"> = {},
): InlineSpan[] {
  const spans: InlineSpan[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        spans.push({ text: node.value, ...marks });
        break;
      case "strong":
        spans.push(
          ...phrasingToSpans(node.children, { ...marks, bold: true }),
        );
        break;
      case "emphasis":
        spans.push(
          ...phrasingToSpans(node.children, { ...marks, italic: true }),
        );
        break;
      case "delete":
        spans.push(...phrasingToSpans(node.children, marks));
        break;
      case "inlineCode":
        spans.push({ text: node.value, ...marks, code: true });
        break;
      case "break":
        spans.push({ text: "\n", ...marks });
        break;
      case "link":
        spans.push(...phrasingToSpans(node.children, marks));
        if (node.url) spans.push({ text: ` (${node.url})`, ...marks });
        break;
      default:
        if ("children" in node && Array.isArray(node.children)) {
          spans.push(
            ...phrasingToSpans(node.children as PhrasingContent[], marks),
          );
        } else if ("value" in node && typeof node.value === "string") {
          spans.push({ text: node.value, ...marks });
        }
    }
  }
  return spans;
}

function phrasingToPlain(nodes: PhrasingContent[]): string {
  return spansToPlain(phrasingToSpans(nodes));
}
