import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface EncryptedTicketCache {
  commitment: `0x${string}`;
  candidateIndex: number;
  stakeWei: string;
  proof: `0x${string}`;
  ticketId?: string;
}

interface TicketVaultState {
  entries: Record<string, EncryptedTicketCache>;
  add(entry: EncryptedTicketCache): void;
  attachTicketId(commitment: `0x${string}`, ticketId: bigint): void;
  remove(commitment: `0x${string}`): void;
}

export const useTicketVault = create<TicketVaultState>()(
  persist(
    (set) => ({
      entries: {},
      add: (entry) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [entry.commitment]: entry,
          },
        })),
      attachTicketId: (commitment, ticketId) =>
        set((state) => {
          const existing = state.entries[commitment];
          if (!existing) return state;
          return {
            entries: {
              ...state.entries,
              [commitment]: {
                ...existing,
                ticketId: ticketId.toString(),
              },
            },
          };
        }),
      remove: (commitment) =>
        set((state) => {
          if (!(commitment in state.entries)) return state;
          const next = { ...state.entries };
          delete next[commitment];
          return { entries: next };
        }),
    }),
    {
      name: "electionbet-ticket-vault",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);

export function getVaultEntry(commitment: `0x${string}`) {
  const state = useTicketVault.getState();
  return state.entries[commitment];
}
