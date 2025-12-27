import { getElectionContractAddress } from "@/lib/config";
import { hexlify } from "ethers";

/**
 * FHE (Fully Homomorphic Encryption) Utilities for ElectionBet
 *
 * This module provides encryption and decryption functions using Zama's FHE SDK.
 * All user data (candidate choices and bet amounts) are encrypted in the browser
 * before being submitted to the blockchain, ensuring complete privacy.
 *
 * Key Features:
 * - Client-side encryption using Zama FHE SDK v0.2.0
 * - Gateway-based public decryption for authorized users
 * - ACL (Access Control List) permission management
 * - Dynamic CDN import to avoid Vite bundler issues
 *
 * @see https://docs.zama.ai/fhevm
 */

// Type definition for Zama FHE instance (loaded dynamically)
type RelayerInstance = any;

// Singleton instance of FHE SDK
let fheInstance: RelayerInstance | null = null;

// Cached SDK module to avoid repeated CDN loads
let sdkModule: any = null;

/**
 * Dynamically loads the Zama FHE SDK from CDN
 *
 * Why CDN import?
 * - Vite cannot resolve `/bundle` export paths in package.json
 * - Direct CDN import avoids bundler configuration issues
 * - Ensures compatibility across different build tools
 *
 * @returns The loaded FHE SDK module
 * @throws Error if SDK fails to load (network issues, CDN unavailable)
 */
async function loadFHESDK() {
  // Return cached module if already loaded
  if (sdkModule) return sdkModule;

  try {
    // Load SDK from Zama's official CDN (v0.2.0)
    sdkModule = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');
    return sdkModule;
  } catch (error) {
    console.error('[FHE] Failed to load SDK from CDN:', error);
    throw new Error('Failed to load FHE SDK. Please check your internet connection.');
  }
}

/**
 * Ensures FHE instance is initialized and returns it
 *
 * This function implements a singleton pattern to avoid repeatedly
 * initializing the FHE SDK, which is an expensive operation.
 *
 * Initialization steps:
 * 1. Load SDK module from CDN (if not already loaded)
 * 2. Initialize WASM and cryptographic libraries
 * 3. Create FHE instance with Sepolia network configuration
 *
 * @returns Initialized FHE SDK instance
 * @throws Error if SDK initialization fails
 */
export async function ensureFheInstance() {
  // Return existing instance if already initialized
  if (fheInstance) {
    return fheInstance;
  }

  // Load SDK module from CDN
  const sdk = await loadFHESDK();
  const { initSDK, createInstance, SepoliaConfig } = sdk;

  // Initialize WASM and crypto libraries (one-time setup)
  await initSDK();

  // Create FHE instance configured for Sepolia testnet
  fheInstance = await createInstance(SepoliaConfig);
  return fheInstance;
}

/**
 * Result of encrypting user prediction data
 */
interface EncryptionResult {
  candidateHandle: `0x${string}`;  // Encrypted candidate ID (euint32)
  stakeHandle: `0x${string}`;      // Encrypted stake amount (euint64)
  proof: `0x${string}`;             // Zero-knowledge proof for verification
}

/**
 * Encrypts user's election prediction using FHE
 *
 * This function encrypts both the candidate choice and bet amount
 * in the user's browser before submitting to the blockchain.
 *
 * Privacy guarantees:
 * - Candidate choice remains encrypted on-chain
 * - Bet amount remains encrypted on-chain
 * - Only the user can decrypt their own data (via ACL permissions)
 * - Smart contract can perform computations on encrypted data
 *
 * @param walletAddress - User's Ethereum wallet address
 * @param candidateIndex - Candidate ID (0, 1, 2, etc.)
 * @param stakeWei - Bet amount in wei
 * @returns Encrypted handles and cryptographic proof
 *
 * @example
 * const result = await encryptElectionPrediction(
 *   "0x123...",
 *   0,  // Candidate #0
 *   parseEther("0.1")  // 0.1 ETH
 * );
 */
export async function encryptElectionPrediction(
  walletAddress: `0x${string}`,
  candidateIndex: number,
  stakeWei: bigint,
): Promise<EncryptionResult> {
  // Ensure FHE SDK is initialized
  const fhe = await ensureFheInstance();

  // Create encrypted input for the smart contract
  const input = fhe.createEncryptedInput(getElectionContractAddress(), walletAddress);

  // Encrypt candidate ID as 32-bit unsigned integer (euint32)
  input.add32(candidateIndex);

  // Encrypt stake amount as 64-bit unsigned integer (euint64)
  // Note: Do NOT multiply by SCALE here - the contract handles scaling internally
  // euint64 can safely hold values up to ~18.4 ETH (18,446,744,073,709,551,615 wei)
  input.add64(stakeWei);

  // Generate encrypted handles and zero-knowledge proof
  const { handles, inputProof } = await input.encrypt();

  // Use hexlify from ethers.js to convert byte arrays to hex strings
  // This follows WeatherWager best practices and ensures proper bytes32 format
  const candidateHandle = hexlify(handles[0]) as `0x${string}`;
  const stakeHandle = hexlify(handles[1]) as `0x${string}`;
  const proof = hexlify(inputProof) as `0x${string}`;

  console.log('[FHE] ✓ Encryption successful', {
    candidateHandle: candidateHandle.substring(0, 10) + '...',
    stakeHandle: stakeHandle.substring(0, 10) + '...',
    proofLength: proof.length,
  });

  return {
    candidateHandle,
    stakeHandle,
    proof,
  };
}

/**
 * Decrypt encrypted data using Gateway public decryption
 * Requires ACL permission to be granted on-chain via FHE.allow()
 *
 * @param encryptedHandle - The encrypted handle (bytes32) to decrypt
 * @returns The decrypted value as bigint
 * @throws Error if decryption fails or ACL permission not granted
 */
export async function decryptValue(encryptedHandle: `0x${string}`): Promise<bigint> {
  try {
    const fhe = await ensureFheInstance();

    // Gateway public decryption - requires ACL permission
    const decrypted = await fhe.publicDecrypt(getElectionContractAddress(), encryptedHandle);

    return decrypted;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[FHE] Decryption failed:', message);

    if (message.includes('ACL') || message.includes('not authorized')) {
      throw new Error('ACL permission not granted. User cannot decrypt this value.');
    }

    throw new Error(`Failed to decrypt value: ${message}`);
  }
}

/**
 * Decrypt multiple encrypted values in batch
 *
 * @param handles - Array of encrypted handles to decrypt
 * @returns Array of decrypted values as bigint[]
 */
export async function decryptBatch(handles: `0x${string}`[]): Promise<bigint[]> {
  const results = await Promise.allSettled(
    handles.map(handle => decryptValue(handle))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.warn(`Failed to decrypt handle at index ${index}:`, result.reason);
      return 0n; // Return 0 for failed decryption
    }
  });
}
