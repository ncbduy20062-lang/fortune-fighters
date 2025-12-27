import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWriteContract } from "wagmi";
import { encodePacked, formatEther, keccak256, parseEther } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import { electionBettingPoolAbi } from "@/lib/abi/electionBettingPool";
import { getElectionContractAddress, SCALE } from "@/lib/config";
import { publicClient } from "@/lib/viem";
import { wagmiConfig } from "@/lib/wagmi";
import { encryptElectionPrediction } from "@/lib/fhe";
import { useTicketVault, getVaultEntry } from "@/state/useTicketVault";
import { useToast } from "@/hooks/use-toast";

export interface ElectionSummary {
  exists: boolean;
  candidateCount: number;
  lockTimestamp: number;
  settled: boolean;
  winningCandidate: number;
  payoutRatio: bigint;
  totalDepositedWei: bigint;
  totalPaidWei: bigint;
  gatewayRequestId: bigint;
  winningTotalScaled: bigint;
}

export interface TicketRecord {
  ticketId: bigint;
  electionId: bigint;
  bettor: `0x${string}`;
  encryptedCandidate: `0x${string}`;
  encryptedStake: `0x${string}`;
  commitment: `0x${string}`;
  claimed: boolean;
}

export async function fetchElectionSummary(electionId: number): Promise<ElectionSummary> {
  const [
    exists,
    candidateCount,
    lockTimestamp,
    settled,
    winningCandidate,
    payoutRatio,
    totalDepositedWei,
    totalPaidWei,
    gatewayRequestId,
    winningTotalScaled,
  ] = await publicClient.readContract({
    address: getElectionContractAddress(),
    abi: electionBettingPoolAbi,
    functionName: "getElection",
    args: [BigInt(electionId)],
  });

  return {
    exists,
    candidateCount: Number(candidateCount),
    lockTimestamp: Number(lockTimestamp),
    settled,
    winningCandidate: Number(winningCandidate),
    payoutRatio,
    totalDepositedWei,
    totalPaidWei,
    gatewayRequestId,
    winningTotalScaled,
  };
}

export async function fetchTickets(electionId: number): Promise<TicketRecord[]> {
  const ticketIds = await publicClient.readContract({
    address: getElectionContractAddress(),
    abi: electionBettingPoolAbi,
    functionName: "getTicketsForElection",
    args: [BigInt(electionId)],
  });

  const ticketPromises = ticketIds.map(async (ticketId: bigint) => {
    const ticket = await publicClient.readContract({
      address: getElectionContractAddress(),
      abi: electionBettingPoolAbi,
      functionName: "getTicket",
      args: [ticketId],
    });

    return {
      ticketId,
      electionId: ticket.electionId,
      bettor: ticket.bettor as `0x${string}`,
      encryptedCandidate: ticket.encryptedCandidate as `0x${string}`,
      encryptedStake: ticket.encryptedStake as `0x${string}`,
      commitment: ticket.commitment as `0x${string}`,
      claimed: ticket.claimed,
    } satisfies TicketRecord;
  });

  return Promise.all(ticketPromises);
}

export function useElectionSummary(electionId: number) {
  return useQuery({
    queryKey: ["election-summary", electionId],
    queryFn: () => fetchElectionSummary(electionId),
    enabled: Number.isFinite(electionId),
    refetchInterval: 30_000,
  });
}

export function useElectionTickets(electionId: number) {
  const attachTicketId = useTicketVault((state) => state.attachTicketId);

  return useQuery({
    queryKey: ["election-tickets", electionId],
    queryFn: async () => {
      const data = await fetchTickets(electionId);
      data.forEach((ticket) => attachTicketId(ticket.commitment, ticket.ticketId));
      return data;
    },
    enabled: Number.isFinite(electionId),
    refetchInterval: 45_000,
  });
}

interface PlacePredictionArgs {
  candidateIndex: number;
  stakeEth: string;
}

export function usePlacePrediction(electionId: number) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addTicket = useTicketVault((state) => state.add);
  const removeTicket = useTicketVault((state) => state.remove);
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationFn: async ({ candidateIndex, stakeEth }: PlacePredictionArgs) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }
      if (candidateIndex === undefined || candidateIndex === null) {
        throw new Error("Candidate not selected");
      }
      const stakeWei = parseEther(stakeEth);
      if (stakeWei <= 0n) {
        throw new Error("Stake amount must be greater than zero");
      }
      if (stakeWei * SCALE > (1n << 64n) - 1n) {
        throw new Error("Stake too large for encrypted range");
      }

      const { candidateHandle, stakeHandle, proof } = await encryptElectionPrediction(address, candidateIndex, stakeWei);
      const commitment = keccak256(
        encodePacked(
          ["address", "uint256", "bytes32", "bytes32"],
          [address, BigInt(electionId), candidateHandle, stakeHandle],
        ),
      ) as `0x${string}`;

      addTicket({
        commitment,
        candidateIndex,
        stakeWei: stakeWei.toString(),
        proof,
      });

      try {
        const hash = await writeContractAsync({
          address: getElectionContractAddress(),
          abi: electionBettingPoolAbi,
          functionName: "placePrediction",
          args: [BigInt(electionId), candidateHandle, stakeHandle, proof, commitment],
          value: stakeWei,
        });

        await waitForTransactionReceipt(wagmiConfig, { hash });
        return { hash, commitment };
      } catch (error) {
        removeTicket(commitment);
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["election-summary", electionId] }),
        queryClient.invalidateQueries({ queryKey: ["election-tickets", electionId] }),
      ]);
      toast({
        title: "Prediction submitted",
        description: "Encrypted ticket has been placed on-chain.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Prediction failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });
}

interface ClaimArgs {
  ticketId: bigint;
  commitment: `0x${string}`;
}

export function useClaimReward(electionId: number) {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();
  const removeTicket = useTicketVault((state) => state.remove);

  return useMutation({
    mutationFn: async ({ ticketId, commitment }: ClaimArgs) => {
      const cache = getVaultEntry(commitment);
      if (!cache) {
        throw new Error("Missing local encryption proof for this ticket");
      }

      const hash = await writeContractAsync({
        address: getElectionContractAddress(),
        abi: electionBettingPoolAbi,
        functionName: "claim",
        args: [ticketId, cache.proof, cache.proof],
      });

      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
      removeTicket(commitment);
      return receipt;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["election-summary", electionId] }),
        queryClient.invalidateQueries({ queryKey: ["election-tickets", electionId] }),
      ]);
      toast({
        title: "Claim submitted",
        description: "Payout request sent. Await gateway confirmation to receive funds.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Claim failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });
}

export function formatWei(value: bigint) {
  return Number.parseFloat(formatEther(value)).toFixed(6);
}
