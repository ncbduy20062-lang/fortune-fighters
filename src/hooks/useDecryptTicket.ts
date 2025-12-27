import { useState, useEffect } from "react";
import { decryptValue } from "@/lib/fhe";
import { SCALE } from "@/lib/config";
import type { TicketRecord } from "@/hooks/useElectionMarkets";

export interface DecryptedTicketData {
  candidateIndex: number;
  stakeWei: bigint;
  stakeEth: string;
  isDecrypting: boolean;
  error: string | null;
}

/**
 * Hook to decrypt a user's encrypted ticket data
 *
 * This hook automatically decrypts the candidate choice and stake amount
 * for a ticket once the FHE SDK is initialized and ACL permissions are granted.
 *
 * @param ticket - The encrypted ticket record from the smart contract
 * @param enabled - Whether to attempt decryption (default: true)
 * @returns Decrypted ticket data with loading and error states
 */
export function useDecryptTicket(
  ticket: TicketRecord | null | undefined,
  enabled: boolean = true
): DecryptedTicketData {
  const [candidateIndex, setCandidateIndex] = useState<number>(-1);
  const [stakeWei, setStakeWei] = useState<bigint>(0n);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket || !enabled) {
      return;
    }

    let cancelled = false;

    const decrypt = async () => {
      setIsDecrypting(true);
      setError(null);

      try {
        // Decrypt candidate index (euint32)
        const candidateHandle = ticket.encryptedCandidate;
        const decryptedCandidate = await decryptValue(candidateHandle);

        if (cancelled) return;
        setCandidateIndex(Number(decryptedCandidate));

        // Decrypt stake amount (euint64)
        const stakeHandle = ticket.encryptedStake;
        const decryptedStake = await decryptValue(stakeHandle);

        if (cancelled) return;
        // Divide by SCALE to get original wei amount
        const originalWei = decryptedStake / SCALE;
        setStakeWei(originalWei);

      } catch (err) {
        if (cancelled) return;

        const message = err instanceof Error ? err.message : String(err);
        console.error('[useDecryptTicket] Decryption failed:', message);

        setError(message);
        setCandidateIndex(-1);
        setStakeWei(0n);
      } finally {
        if (!cancelled) {
          setIsDecrypting(false);
        }
      }
    };

    decrypt();

    return () => {
      cancelled = true;
    };
  }, [ticket, enabled]);

  // Format stake as ETH string
  const stakeEth = stakeWei > 0n
    ? (Number(stakeWei) / 1e18).toFixed(6)
    : "0.000000";

  return {
    candidateIndex,
    stakeWei,
    stakeEth,
    isDecrypting,
    error,
  };
}

/**
 * Hook to decrypt multiple tickets at once
 *
 * @param tickets - Array of encrypted ticket records
 * @param enabled - Whether to attempt decryption
 * @returns Map of ticket ID to decrypted data
 */
export function useDecryptTickets(
  tickets: TicketRecord[] | null | undefined,
  enabled: boolean = true
): Map<bigint, DecryptedTicketData> {
  const [decryptedMap, setDecryptedMap] = useState<Map<bigint, DecryptedTicketData>>(new Map());

  useEffect(() => {
    if (!tickets || !enabled || tickets.length === 0) {
      setDecryptedMap(new Map());
      return;
    }

    let cancelled = false;

    const decryptAll = async () => {
      const newMap = new Map<bigint, DecryptedTicketData>();

      // Initialize all as decrypting
      tickets.forEach(ticket => {
        newMap.set(ticket.ticketId, {
          candidateIndex: -1,
          stakeWei: 0n,
          stakeEth: "0.000000",
          isDecrypting: true,
          error: null,
        });
      });

      if (!cancelled) {
        setDecryptedMap(new Map(newMap));
      }

      // Decrypt each ticket
      await Promise.allSettled(
        tickets.map(async (ticket) => {
          try {
            const candidateHandle = ticket.encryptedCandidate;
            const decryptedCandidate = await decryptValue(candidateHandle);

            const stakeHandle = ticket.encryptedStake;
            const decryptedStake = await decryptValue(stakeHandle);

            const originalWei = decryptedStake / SCALE;
            const stakeEth = (Number(originalWei) / 1e18).toFixed(6);

            if (!cancelled) {
              newMap.set(ticket.ticketId, {
                candidateIndex: Number(decryptedCandidate),
                stakeWei: originalWei,
                stakeEth,
                isDecrypting: false,
                error: null,
              });
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[useDecryptTickets] Failed to decrypt ticket ${ticket.ticketId}:`, message);

            if (!cancelled) {
              newMap.set(ticket.ticketId, {
                candidateIndex: -1,
                stakeWei: 0n,
                stakeEth: "0.000000",
                isDecrypting: false,
                error: message,
              });
            }
          }
        })
      );

      if (!cancelled) {
        setDecryptedMap(new Map(newMap));
      }
    };

    decryptAll();

    return () => {
      cancelled = true;
    };
  }, [tickets, enabled]);

  return decryptedMap;
}
