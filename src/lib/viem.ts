import { createPublicClient, http } from "viem";
import { APP_CHAIN, RPC_URL } from "@/lib/config";

export const publicClient = createPublicClient({
  chain: APP_CHAIN,
  transport: http(RPC_URL),
});
