import {
  Code,
  ConnectError,
  createClient,
  type Interceptor,
} from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { AuthService } from "../gen/auth/v1/auth_pb.js";
import { OfficeService } from "../gen/office/v1/office_pb.js";
import { loadSession, notifyAuthExpired } from "./session.ts";

function hostnameOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function resolveApiBaseUrl(): string {
  const localApi = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
  if (typeof window === "undefined") {
    return localApi;
  }

  const host = window.location.hostname;

  if (/\.ngrok-free\.app$/i.test(host)) {
    return import.meta.env.VITE_API_BASE_NGROK_URL ?? localApi;
  }

  const cloudflareUiHost = hostnameOf(
    import.meta.env.VITE_BASE_CLOUDFLARE_TUNNEL_URL,
  );
  if (
    cloudflareUiHost &&
    host.toLowerCase() === cloudflareUiHost.toLowerCase()
  ) {
    return import.meta.env.VITE_API_BASE_CLOUDFLARE_TUNNEL_URL ?? localApi;
  }

  return localApi;
}

const baseUrl = resolveApiBaseUrl();

const authInterceptor: Interceptor = (next) => async (req) => {
  const session = loadSession();
  if (session?.accessToken) {
    req.header.set("Authorization", `Bearer ${session.accessToken}`);
  }

  try {
    return await next(req);
  } catch (err) {
    if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
      notifyAuthExpired();
    }
    throw err;
  }
};

/**
 * gRPC-Web transport. Browsers cannot speak native gRPC, so the base URL
 * must point at the gateway/proxy. When the UI is served from *.ngrok-free.app,
 * VITE_API_BASE_NGROK_URL is used. When it is served from
 * VITE_BASE_CLOUDFLARE_TUNNEL_URL, VITE_API_BASE_CLOUDFLARE_TUNNEL_URL is used.
 */
export const transport = createGrpcWebTransport({
  baseUrl,
  interceptors: [authInterceptor],
});

export const authClient = createClient(AuthService, transport);
export const officeClient = createClient(OfficeService, transport);
