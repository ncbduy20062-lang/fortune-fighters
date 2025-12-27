/**
 * Wagmi and RainbowKit Configuration
 *
 * This module configures Web3 wallet connectivity for the ElectionBet DApp.
 *
 * Key Features:
 * - Sepolia testnet configuration
 * - RainbowKit wallet connectors with Coinbase explicitly DISABLED
 * - Custom connector list: MetaMask, WalletConnect, Rainbow, Injected wallets
 * - HTTP transport with reliable public RPC endpoints
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';
import {
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  injectedWallet
} from '@rainbow-me/rainbowkit/wallets';

// ===========================
// Environment Configuration
// ===========================

const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '4ef1c6cdd2f246f2b1c8d5f8f02f2a1d';
const APP_NAME = 'ElectionBet';
const APP_DESCRIPTION = 'Encrypted Election Predictions with FHE';
const APP_URL = 'https://electionbet.app';
const APP_ICON = '/icon.svg';
const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

// ===========================
// Wagmi Configuration
// ===========================

/**
 * Main Wagmi configuration for Web3 interactions
 *
 * @note Coinbase Wallet connector is intentionally excluded from the wallet list
 *       to avoid connection issues with FHE operations and inconsistent behavior
 *
 * @see https://www.rainbowkit.com/docs/custom-wallet-list for custom wallet configuration
 */
export const wagmiConfig = getDefaultConfig({
  appName: APP_NAME,
  projectId: PROJECT_ID,

  // Sepolia testnet for FHE development
  chains: [sepolia],

  // Wallet configuration with Coinbase excluded
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,      // Most popular and tested
        rainbowWallet,       // RainbowKit's native wallet
        walletConnectWallet, // WalletConnect protocol support
        injectedWallet,      // Support for other injected wallets (Trust, Brave, etc.)
      ],
    },
  ],

  // Use reliable public RPC endpoints with HTTP transport
  transports: {
    [sepolia.id]: http(RPC_URL, {
      timeout: 30_000, // 30 second timeout for FHE operations
      retryCount: 3,   // Retry failed requests 3 times
    }),
  },

  // SSR support disabled for Vite
  ssr: false,
});
