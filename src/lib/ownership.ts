export type OwnerFilter = "all" | "personal" | "office";

export function isPersonalOfficeId(officeId: string | undefined): boolean {
  return !officeId?.trim();
}

export function ownerMatches(
  officeId: string | undefined,
  filter: OwnerFilter,
): boolean {
  const personal = isPersonalOfficeId(officeId);
  if (filter === "personal") return personal;
  if (filter === "office") return !personal;
  return true;
}

export function mergeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    seen.set(item.id, item);
  }
  return [...seen.values()];
}

export async function listByOwnerFilter<T extends { id: string; officeId: string }>(
  filter: OwnerFilter,
  officeId: string | undefined,
  list: (officeId: string) => Promise<T[]>,
): Promise<T[]> {
  const requests: Promise<T[]>[] = [];
  if (filter !== "office") {
    requests.push(list(""));
  }
  if (officeId && filter !== "personal") {
    requests.push(list(officeId));
  }
  if (requests.length === 0) return [];
  const chunks = await Promise.all(requests);
  return mergeById(chunks.flat()).filter((item) =>
    ownerMatches(item.officeId, filter),
  );
}

export function defaultCreateOfficeId(
  filter: OwnerFilter,
  officeId: string | undefined,
): string {
  if (filter === "office" && officeId) return officeId;
  return "";
}
