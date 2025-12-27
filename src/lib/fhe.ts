import { getElectionContractAddress } from "@/lib/config";
import { hexlify } from "ethers";

/**
 * FHE (Fully Homomorphic Encryption) Utilities for Fortune Fighters
 *
 * This module provides encryption and decryption functions using Zama's FHE SDK.
 * All user data (fighter choices and bet amounts) are encrypted in the browser
 * before being submitted to the blockchain, ensuring complete privacy.
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
 * Official Sepolia config from Zama documentation
 * @see https://docs.zama.org/protocol/solidity-guides/smart-contract/configure/contract_addresses
 */
const CustomSepoliaConfig = {
  chainId: 11155111,
  relayerUrl: "https://relayer.testnet.zama.org",
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
  kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  inputVerifierContractAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  verifyingContractAddressDecryption: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
  verifyingContractAddressInputVerification: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
  gatewayChainId: 55815,
};

/**
 * Dynamically loads the Zama FHE SDK from CDN
 */
async function loadFHESDK() {
  if (sdkModule) return sdkModule;

  try {
    sdkModule = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');
    return sdkModule;
  } catch (error) {
    console.error('[FHE] Failed to load SDK from CDN:', error);
    throw new Error('Failed to load FHE SDK. Please check your internet connection.');
  }
}

/**
 * Ensures FHE instance is initialized and returns it
 */
export async function ensureFheInstance() {
  if (fheInstance) {
    return fheInstance;
  }

  const sdk = await loadFHESDK();
  const { initSDK, createInstance } = sdk;

  await initSDK();

  // Use custom config with correct relayer URL
  fheInstance = await createInstance(CustomSepoliaConfig);
  return fheInstance;
}

/**
 * Result of encrypting user prediction data
 */
interface EncryptionResult {
  candidateHandle: `0x${string}`;
  stakeHandle: `0x${string}`;
  proof: `0x${string}`;
}

/**
 * Encrypts user's bet using FHE
 */
export async function encryptElectionPrediction(
  walletAddress: `0x${string}`,
  candidateIndex: number,
  stakeWei: bigint,
): Promise<EncryptionResult> {
  const fhe = await ensureFheInstance();

  const input = fhe.createEncryptedInput(getElectionContractAddress(), walletAddress);

  input.add32(candidateIndex);
  input.add64(stakeWei);

  const { handles, inputProof } = await input.encrypt();

  const candidateHandle = hexlify(handles[0]) as `0x${string}`;
  const stakeHandle = hexlify(handles[1]) as `0x${string}`;
  const proof = hexlify(inputProof) as `0x${string}`;

  console.log('[FHE] Encryption successful', {
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
 */
export async function decryptValue(encryptedHandle: `0x${string}`): Promise<bigint> {
  try {
    const fhe = await ensureFheInstance();
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
      return 0n;
    }
  });
}
