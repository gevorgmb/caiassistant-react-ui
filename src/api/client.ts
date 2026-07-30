import { createClient, type Interceptor } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { AuthService } from "../gen/auth/v1/auth_pb.js";
import { OfficeService } from "../gen/office/v1/office_pb.js";
import { loadSession } from "./session.ts";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const authInterceptor: Interceptor = (next) => async (req) => {
  const session = loadSession();
  if (session?.accessToken) {
    req.header.set("Authorization", `Bearer ${session.accessToken}`);
  }
  return await next(req);
};

/**
 * gRPC-Web transport. Browsers cannot speak native gRPC, so
 * VITE_API_BASE_URL must point at the gateway/proxy from local/.
 */
export const transport = createGrpcWebTransport({
  baseUrl,
  interceptors: [authInterceptor],
});

export const authClient = createClient(AuthService, transport);
export const officeClient = createClient(OfficeService, transport);
