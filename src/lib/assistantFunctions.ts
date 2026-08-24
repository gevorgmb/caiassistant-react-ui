export type AssistantFunctionId =
  | "build-document"
  | "edit-document"
  | "check-document"
  | "build-agenda"
  | "summarize-todos"
  | "build-events-report";

export type AssistantFunction = {
  id: AssistantFunctionId;
  rpc: string;
  requiresOffice: boolean;
};

export const ASSISTANT_FUNCTIONS: AssistantFunction[] = [
  {
    id: "build-document",
    rpc: "BuildDocument",
    requiresOffice: false,
  },
  {
    id: "edit-document",
    rpc: "EditDocument",
    requiresOffice: false,
  },
  {
    id: "check-document",
    rpc: "CheckDocument",
    requiresOffice: false,
  },
  {
    id: "build-agenda",
    rpc: "BuildAgenda",
    requiresOffice: false,
  },
  {
    id: "summarize-todos",
    rpc: "SummarizeTodos",
    requiresOffice: true,
  },
  {
    id: "build-events-report",
    rpc: "BuildEventsReport",
    requiresOffice: true,
  },
];

const BY_ID = new Map(
  ASSISTANT_FUNCTIONS.map((fn) => [fn.id, fn] as const),
);

export function getAssistantFunction(
  id: string | undefined,
): AssistantFunction | undefined {
  if (!id) return undefined;
  return BY_ID.get(id as AssistantFunctionId);
}
