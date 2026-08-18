import { Code, ConnectError } from "@connectrpc/connect";

export function errorMessage(err: unknown): string {
  if (err instanceof ConnectError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Unexpected error";
}

export function isUnauthenticated(err: unknown): boolean {
  return err instanceof ConnectError && err.code === Code.Unauthenticated;
}
