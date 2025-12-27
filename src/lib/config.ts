import { sepolia } from "wagmi/chains";

export const APP_CHAIN = sepolia;
export { sepolia };

export const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "4ef1c6cdd2f246f2b1c8d5f8f02f2a1d";

export const FHE_GATEWAY_URL = import.meta.env.VITE_FHE_GATEWAY_URL || "https://gateway.testnet.zama.ai";

export const DEFAULT_ELECTION_ID = Number.parseInt(import.meta.env.VITE_ELECTION_ID || "42", 10);

export const SCALE = BigInt(1_000_000);

const addressFromEnv = import.meta.env.VITE_ELECTION_CONTRACT_ADDRESS as `0x${string}` | undefined;

export function getElectionContractAddress(): `0x${string}` {
  if (!addressFromEnv) {
    throw new Error("VITE_ELECTION_CONTRACT_ADDRESS is not configured");
  }
  return addressFromEnv;
}
