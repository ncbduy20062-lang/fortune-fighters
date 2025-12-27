import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import App from "./App.tsx";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";

// Create a QueryClient instance for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

/**
 * Application entry point with Web3 providers
 * - QueryClientProvider: Manages async data fetching and caching
 * - WagmiProvider: Manages wallet connections and blockchain interactions
 * - RainbowKitProvider: Provides wallet connection UI (MetaMask, WalletConnect, Rainbow)
 * - Coinbase connector is intentionally disabled to avoid connection issues
 */
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider>
        <App />
      </RainbowKitProvider>
    </WagmiProvider>
  </QueryClientProvider>
);
