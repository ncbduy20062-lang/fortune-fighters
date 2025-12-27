import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Wallet, Check, Zap, Flame, Snowflake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, keccak256, encodePacked } from "viem";
import { encryptElectionPrediction } from "@/lib/fhe";
import { getElectionContractAddress, DEFAULT_ELECTION_ID } from "@/lib/config";
import ElectionBetABI from "@/lib/abi/ElectionBettingPool.json";
import { getFighterById, getElementColor } from "@/data/fighters";

interface BetPanelProps {
  fighterId: number | null;
  fighterName?: string;
}

/**
 * BetPanel Component - Cyberpunk Gaming Style
 * Secure bet submission with FHE encryption
 */
const BetPanel = ({ fighterId, fighterName }: BetPanelProps) => {
  const [amount, setAmount] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending: isWriting } = useWriteContract();
  const { isLoading: isTxConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const fighter = fighterId !== null ? getFighterById(fighterId) : null;
  const colors = fighter ? getElementColor(fighter.element) : null;

  const handlePlaceBet = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Connect your wallet to place a bet.",
        variant: "destructive",
      });
      return;
    }

    if (fighterId === null || fighterId === undefined) {
      toast({
        title: "No Fighter Selected",
        description: "Choose your champion first.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Enter a valid bet amount (min 0.01 ETH).",
        variant: "destructive",
      });
      return;
    }

    if (amountNum < 0.01) {
      toast({
        title: "Amount Too Small",
        description: "Minimum bet is 0.01 ETH.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsEncrypting(true);
      const stakeWei = parseEther(amount);

      toast({
        title: "Encrypting Bet",
        description: "Your bet is being encrypted with FHE...",
      });

      const { candidateHandle, stakeHandle, proof } = await encryptElectionPrediction(
        address,
        fighterId,
        stakeWei
      );

      const commitment = keccak256(
        encodePacked(
          ["address", "uint256", "bytes32", "bytes32"],
          [address, BigInt(DEFAULT_ELECTION_ID), candidateHandle, stakeHandle]
        )
      );

      setIsEncrypting(false);

      toast({
        title: "Encryption Complete",
        description: "Submitting encrypted bet to blockchain...",
      });

      writeContract({
        address: getElectionContractAddress(),
        abi: ElectionBetABI.abi,
        functionName: "placePrediction",
        args: [
          BigInt(DEFAULT_ELECTION_ID),
          candidateHandle,
          stakeHandle,
          proof,
          commitment,
        ],
        value: stakeWei,
      });

    } catch (error) {
      setIsEncrypting(false);
      console.error("Bet placement error:", error);

      toast({
        title: "Bet Failed",
        description: error instanceof Error ? error.message : "Failed to place bet. Try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (txHash && !isTxConfirming && !isWriting) {
      toast({
        title: "Bet Placed Successfully!",
        description: `Your encrypted bet on ${fighterName} is now on-chain.`,
      });
      setAmount("");
    }
  }, [txHash, isTxConfirming, isWriting, fighterName, toast]);

  const isProcessing = isEncrypting || isWriting || isTxConfirming;

  return (
    <Card className={`border-2 overflow-hidden ${colors ? colors.border : 'border-primary/30'} bg-card/50 backdrop-blur-sm`}>
      {/* Card Header */}
      <div className={`bg-gradient-to-br ${colors ? colors.primary : 'from-primary/20 to-primary/5'} p-4 md:p-6 border-b border-primary/30`}>
        <h3 className="font-display font-bold text-lg flex items-center gap-2 text-white">
          <Zap className="w-5 h-5" />
          PLACE BET
        </h3>
        <p className="text-xs text-white/70 mt-1 font-display">
          ENCRYPTED • PRIVATE • SECURE
        </p>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* Fighter Display */}
        {fighter ? (
          <div className={`${colors?.bg} rounded-lg p-4 border ${colors?.border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors?.primary} flex items-center justify-center`}>
                  {fighter.element === 'fire' && <Flame className="w-5 h-5 text-white" />}
                  {fighter.element === 'ice' && <Snowflake className="w-5 h-5 text-white" />}
                  {fighter.element === 'lightning' && <Zap className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-display text-muted-foreground">BETTING ON</p>
                  <p className="font-display font-bold">{fighter.name}</p>
                </div>
              </div>
              <Check className={`w-5 h-5 ${colors?.text}`} />
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-muted">
            <p className="text-sm text-muted-foreground text-center font-display">
              SELECT A FIGHTER ABOVE
            </p>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-display font-semibold flex items-center justify-between">
            <span>BET AMOUNT</span>
            <span className="text-xs font-normal text-muted-foreground">MIN: 0.01 ETH</span>
          </Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-display font-bold h-14 pr-16 bg-muted/50 border-primary/30 focus:border-primary"
              disabled={fighterId === null || fighterId === undefined || isProcessing}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-display font-medium text-muted-foreground">
              ETH
            </div>
          </div>
        </div>

        {/* Wallet Warning */}
        {!isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3">
            <Wallet className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground font-display">
              CONNECT WALLET TO PLACE BETS
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={fighterId === null || fighterId === undefined || !amount || !isConnected || isProcessing}
          className={`w-full h-12 font-display font-bold text-base transition-all ${
            colors
              ? `bg-gradient-to-r ${colors.primary} hover:opacity-90`
              : 'bg-primary hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          {isEncrypting ? (
            <>
              <Lock className="w-4 h-4 mr-2 animate-pulse" />
              ENCRYPTING...
            </>
          ) : isWriting || isTxConfirming ? (
            <>
              <Shield className="w-4 h-4 mr-2 animate-spin" />
              CONFIRMING...
            </>
          ) : !isConnected ? (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              CONNECT WALLET
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              PLACE BET
            </>
          )}
        </Button>

        {/* Transaction Link */}
        {txHash && (
          <div className="pt-2 border-t border-primary/20">
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center justify-center gap-1 font-display"
            >
              VIEW TRANSACTION →
            </a>
          </div>
        )}

        {/* Privacy Note */}
        <div className="pt-2 border-t border-primary/20">
          <p className="text-[10px] text-muted-foreground text-center leading-relaxed font-display">
            <Lock className="w-3 h-3 inline mr-1" />
            ALL DATA ENCRYPTED WITH ZAMA FHE
          </p>
        </div>
      </div>
    </Card>
  );
};

export default BetPanel;
