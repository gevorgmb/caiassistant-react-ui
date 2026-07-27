import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { AuthService } from "../gen/auth/v1/auth_pb.js";

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/**
 * gRPC-Web transport. Browsers cannot speak native gRPC, so
 * VITE_API_BASE_URL must point at the gateway/proxy from local/.
 */
export const transport = createGrpcWebTransport({
  baseUrl,
});

export const authClient = createClient(AuthService, transport);
