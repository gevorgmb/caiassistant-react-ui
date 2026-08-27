import { createClient } from "@connectrpc/connect";
import { AssistantService } from "../gen/assistant/v1/assistant_pb.js";
import { transport } from "./client.ts";

export const assistantClient = createClient(AssistantService, transport);
