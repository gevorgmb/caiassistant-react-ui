import { createClient, type Interceptor } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { AuthService } from "../gen/auth/v1/auth_pb.js";
import { OfficeService } from "../gen/office/v1/office_pb.js";
import { loadSession } from "./session.ts";

function resolveApiBaseUrl(): string {
  const isNgrok =
    typeof window !== "undefined" &&
    /\.ngrok-free\.app$/i.test(window.location.hostname);
  if (isNgrok) {
    return (
      import.meta.env.VITE_API_BASE_NGROK_URL ??
      import.meta.env.VITE_API_BASE_URL ??
      "http://localhost:8080"
    );
  }
  return import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
}

const baseUrl = resolveApiBaseUrl();

const authInterceptor: Interceptor = (next) => async (req) => {
  const session = loadSession();
  if (session?.accessToken) {
    req.header.set("Authorization", `Bearer ${session.accessToken}`);
  }
  return await next(req);
};

/**
 * gRPC-Web transport. Browsers cannot speak native gRPC, so the base URL
 * must point at the gateway/proxy. When the UI is served from *.ngrok-free.app,
 * VITE_API_BASE_NGROK_URL is used instead of VITE_API_BASE_URL.
 */
export const transport = createGrpcWebTransport({
  baseUrl,
  interceptors: [authInterceptor],
});

export const authClient = createClient(AuthService, transport);
export const officeClient = createClient(OfficeService, transport);
