import { AiAction, Language } from "../gen/assistant/v1/assistant_pb.js";
import type { AssistantFunctionId } from "./assistantFunctions.ts";

export type AssistantIssue = {
  severity: string;
  message: string;
  suggestion?: string;
};

export type AssistantAgendaItem = {
  title: string;
  description?: string;
  durationMinutes?: number;
};

export type AssistantResult =
  | { kind: "document"; content: string }
  | {
      kind: "check";
      summary: string;
      issues: AssistantIssue[];
      revisedDocument?: string;
    }
  | { kind: "agenda"; title: string; items: AssistantAgendaItem[]; markdown: string }
  | { kind: "report"; title: string; summary: string; markdown: string };

export type AssistantRequestState = {
  topic: string;
  instructions: string;
  documentType: string;
  document: string;
  focus: string;
  durationMinutes: string;
  meetingDate: string;
  todoStatus: string;
  searchText: string;
  from: string;
  to: string;
  eventFocus: string;
  language: Language;
};

const ACTION_BY_FUNCTION: Record<AssistantFunctionId, AiAction> = {
  "build-document": AiAction.BUILD_DOCUMENT,
  "edit-document": AiAction.EDIT_DOCUMENT,
  "check-document": AiAction.CHECK_DOCUMENT,
  "build-agenda": AiAction.BUILD_AGENDA,
  "summarize-todos": AiAction.SUMMARIZE_TODOS,
  "build-events-report": AiAction.EVENT_REPORTS,
};

const FUNCTION_BY_ACTION = new Map<AiAction, AssistantFunctionId>(
  Object.entries(ACTION_BY_FUNCTION).map(
    ([id, action]) => [action, id as AssistantFunctionId] as const,
  ),
);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toLocalInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 0, 0);
}

export function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function defaultRequestState(language: Language): AssistantRequestState {
  return {
    topic: "",
    instructions: "",
    documentType: "",
    document: "",
    focus: "",
    durationMinutes: "60",
    meetingDate: "",
    todoStatus: "",
    searchText: "",
    from: toLocalInputValue(startOfMonth(new Date())),
    to: toLocalInputValue(endOfMonth(new Date())),
    eventFocus: "both",
    language,
  };
}

export function actionFromFunctionId(id: AssistantFunctionId): AiAction {
  return ACTION_BY_FUNCTION[id];
}

export function functionIdFromAction(
  action: AiAction,
): AssistantFunctionId | undefined {
  return FUNCTION_BY_ACTION.get(action);
}

export function generatedDocumentPath(
  functionId: AssistantFunctionId,
  documentId: string,
): string {
  return `/ai-assistant/${functionId}/${documentId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asLanguage(value: unknown, fallback: Language): Language {
  if (value === Language.ENGLISH || value === Language.ARMENIAN) {
    return value;
  }
  return fallback;
}

export function serializeRequestParams(
  functionId: AssistantFunctionId,
  state: AssistantRequestState,
  officeId?: string,
): string {
  const language = state.language;
  switch (functionId) {
    case "build-document":
      return JSON.stringify({
        topic: state.topic.trim(),
        instructions: state.instructions.trim() || undefined,
        documentType: state.documentType || undefined,
        officeId: officeId || undefined,
        language,
      });
    case "edit-document":
      return JSON.stringify({
        document: state.document.trim(),
        instructions: state.instructions.trim(),
        language,
      });
    case "check-document":
      return JSON.stringify({
        document: state.document.trim(),
        focus: state.focus || undefined,
        language,
      });
    case "build-agenda":
      return JSON.stringify({
        topic: state.topic.trim(),
        instructions: state.instructions.trim() || undefined,
        officeId: officeId || undefined,
        meetingDate: state.meetingDate || undefined,
        durationMinutes: Number.parseInt(state.durationMinutes, 10) || 0,
        language,
      });
    case "summarize-todos":
      return JSON.stringify({
        officeId: officeId || undefined,
        status: state.todoStatus ? Number(state.todoStatus) : undefined,
        searchText: state.searchText.trim() || undefined,
        language,
      });
    case "build-events-report":
      return JSON.stringify({
        officeId: officeId || undefined,
        from: state.from,
        to: state.to,
        focus: state.eventFocus || undefined,
        language,
      });
  }
}

export function parseRequestParams(
  json: string,
  fallbackLanguage: Language,
): AssistantRequestState | null {
  try {
    const raw: unknown = JSON.parse(json);
    if (!isRecord(raw)) return null;
    const next = defaultRequestState(fallbackLanguage);
    const topic = asString(raw.topic);
    if (topic !== undefined) next.topic = topic;
    const instructions = asString(raw.instructions);
    if (instructions !== undefined) next.instructions = instructions;
    const documentType = asString(raw.documentType);
    if (documentType !== undefined) next.documentType = documentType;
    const document = asString(raw.document);
    if (document !== undefined) next.document = document;
    const focus = asString(raw.focus);
    if (focus !== undefined) next.focus = focus;
    if (typeof raw.durationMinutes === "number") {
      next.durationMinutes = String(raw.durationMinutes);
    } else {
      const durationMinutes = asString(raw.durationMinutes);
      if (durationMinutes !== undefined) next.durationMinutes = durationMinutes;
    }
    const meetingDate = asString(raw.meetingDate);
    if (meetingDate !== undefined) next.meetingDate = meetingDate;
    if (typeof raw.status === "number") {
      next.todoStatus = String(raw.status);
    } else {
      const todoStatus = asString(raw.status);
      if (todoStatus !== undefined) next.todoStatus = todoStatus;
    }
    const searchText = asString(raw.searchText);
    if (searchText !== undefined) next.searchText = searchText;
    const from = asString(raw.from);
    if (from !== undefined) next.from = from;
    const to = asString(raw.to);
    if (to !== undefined) next.to = to;
    const eventFocus = asString(raw.eventFocus);
    if (eventFocus !== undefined) {
      next.eventFocus = eventFocus;
    } else if (focus === "both" || focus === "past" || focus === "planned") {
      next.eventFocus = focus;
    }
    next.language = asLanguage(raw.language, fallbackLanguage);
    return next;
  } catch {
    return null;
  }
}

export function serializeResult(result: AssistantResult): string {
  switch (result.kind) {
    case "document":
      return JSON.stringify({ kind: "document", content: result.content });
    case "check":
      return JSON.stringify({
        kind: "check",
        summary: result.summary,
        issues: result.issues.map((issue) => ({
          severity: issue.severity,
          message: issue.message,
          suggestion: issue.suggestion,
        })),
        revisedDocument: result.revisedDocument,
      });
    case "agenda":
      return JSON.stringify({
        kind: "agenda",
        title: result.title,
        items: result.items.map((item) => ({
          title: item.title,
          description: item.description,
          durationMinutes: item.durationMinutes,
        })),
        markdown: result.markdown,
      });
    case "report":
      return JSON.stringify({
        kind: "report",
        title: result.title,
        summary: result.summary,
        markdown: result.markdown,
      });
  }
}

function parseIssues(value: unknown): AssistantIssue[] {
  if (!Array.isArray(value)) return [];
  const issues: AssistantIssue[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.message !== "string") continue;
    issues.push({
      severity: typeof item.severity === "string" ? item.severity : "",
      message: item.message,
      suggestion:
        typeof item.suggestion === "string" ? item.suggestion : undefined,
    });
  }
  return issues;
}

function parseAgendaItems(value: unknown): AssistantAgendaItem[] {
  if (!Array.isArray(value)) return [];
  const items: AssistantAgendaItem[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.title !== "string") continue;
    items.push({
      title: item.title,
      description:
        typeof item.description === "string" ? item.description : undefined,
      durationMinutes:
        typeof item.durationMinutes === "number"
          ? item.durationMinutes
          : undefined,
    });
  }
  return items;
}

export function parseResult(json: string): AssistantResult | null {
  try {
    const raw: unknown = JSON.parse(json);
    if (!isRecord(raw)) {
      return json.trim() ? { kind: "document", content: json } : null;
    }
    switch (raw.kind) {
      case "document":
        return {
          kind: "document",
          content: typeof raw.content === "string" ? raw.content : "",
        };
      case "check":
        return {
          kind: "check",
          summary: typeof raw.summary === "string" ? raw.summary : "",
          issues: parseIssues(raw.issues),
          revisedDocument:
            typeof raw.revisedDocument === "string"
              ? raw.revisedDocument
              : undefined,
        };
      case "agenda":
        return {
          kind: "agenda",
          title: typeof raw.title === "string" ? raw.title : "",
          items: parseAgendaItems(raw.items),
          markdown: typeof raw.markdown === "string" ? raw.markdown : "",
        };
      case "report":
        return {
          kind: "report",
          title: typeof raw.title === "string" ? raw.title : "",
          summary: typeof raw.summary === "string" ? raw.summary : "",
          markdown: typeof raw.markdown === "string" ? raw.markdown : "",
        };
      default:
        if (typeof raw.content === "string") {
          return { kind: "document", content: raw.content };
        }
        return json.trim() ? { kind: "document", content: json } : null;
    }
  } catch {
    return json.trim() ? { kind: "document", content: json } : null;
  }
}

export function resultPreview(response: string): string {
  const result = parseResult(response);
  if (!result) return response.trim();
  switch (result.kind) {
    case "document":
      return result.content;
    case "check":
      return result.summary || result.revisedDocument || "";
    case "agenda":
      return result.title || result.markdown;
    case "report":
      return result.title || result.summary || result.markdown;
  }
}

export function snapshotKey(requestParams: string, response: string): string {
  return `${requestParams}\n${response}`;
}
