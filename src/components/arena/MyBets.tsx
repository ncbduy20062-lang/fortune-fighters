import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, Trophy, Clock, Swords, Lock } from "lucide-react";
import { useElectionTickets } from "@/hooks/useElectionMarkets";
import { useDecryptTickets } from "@/hooks/useDecryptTicket";
import { DEFAULT_ELECTION_ID } from "@/lib/config";
import { useState, useMemo } from "react";

/**
 * MyBets Component - Cyberpunk Gaming Style
 * Secure bet viewer with client-side decryption
 */
const MyBets = () => {
  const { address } = useAccount();
  const [showDecrypted, setShowDecrypted] = useState(true);
  const { data: allTickets, isLoading: isLoadingTickets } = useElectionTickets(DEFAULT_ELECTION_ID);

  const myTickets = useMemo(() => {
    return allTickets?.filter(
      ticket => ticket.bettor.toLowerCase() === address?.toLowerCase()
    );
  }, [allTickets, address]);

  const decryptedMap = useDecryptTickets(myTickets, showDecrypted);

  // No Wallet Connected
  if (!address) {
    return (
      <Card className="p-6 sm:p-8 text-center bg-card/50 border-primary/30">
        <Swords className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg sm:text-xl font-display font-bold mb-2">CONNECT WALLET</h3>
        <p className="text-sm sm:text-base text-muted-foreground font-body">
          Connect your wallet to view your encrypted bets
        </p>
      </Card>
    );
  }

  // Loading
  if (isLoadingTickets) {
    return (
      <Card className="p-6 sm:p-8 text-center bg-card/50 border-primary/30">
        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 animate-spin text-primary" />
        <p className="text-sm sm:text-base text-muted-foreground font-display">LOADING YOUR BETS...</p>
      </Card>
    );
  }

  // No Bets Found
  if (!myTickets || myTickets.length === 0) {
    return (
      <Card className="p-6 sm:p-8 text-center bg-card/50 border-primary/30">
        <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg sm:text-xl font-display font-bold mb-2">NO BETS YET</h3>
        <p className="text-sm sm:text-base text-muted-foreground font-body">
          You haven't placed any bets yet. Choose a fighter above!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-display font-bold">MY BETS</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDecrypted(!showDecrypted)}
          className="gap-2 w-full sm:w-auto font-display border-primary/30 hover:bg-primary/10"
        >
          {showDecrypted ? (
            <>
              <Eye className="w-4 h-4" />
              HIDE DETAILS
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              SHOW DETAILS
            </>
          )}
        </Button>
      </div>

      {/* Bet Cards */}
      <div className="grid gap-4">
        {myTickets.map((ticket) => {
          const decrypted = decryptedMap.get(ticket.ticketId);
          const isDecrypting = decrypted?.isDecrypting ?? true;
          const hasError = decrypted?.error != null;

          return (
            <Card key={ticket.ticketId.toString()} className="border-2 border-primary/30 overflow-hidden bg-card/50 backdrop-blur-sm">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 border-b border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <span className="font-display font-bold text-primary text-sm">#{ticket.ticketId.toString()}</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold">BET #{ticket.ticketId.toString()}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {ticket.commitment.slice(0, 8)}...{ticket.commitment.slice(-6)}
                    </p>
                  </div>
                </div>

                {ticket.claimed ? (
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 font-display">
                    <Trophy className="w-3 h-3 mr-1" />
                    CLAIMED
                  </Badge>
                ) : (
                  <Badge className="bg-primary/20 text-primary border border-primary/30 font-display">
                    <Clock className="w-3 h-3 mr-1" />
                    ACTIVE
                  </Badge>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4">
                {showDecrypted && (
                  <div className="space-y-3">
                    {isDecrypting && (
                      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-display">DECRYPTING...</span>
                      </div>
                    )}

                    {!isDecrypting && hasError && (
                      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-sm font-display font-medium text-destructive mb-1">
                          DECRYPTION FAILED
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {decrypted?.error}
                        </p>
                      </div>
                    )}

                    {!isDecrypting && !hasError && decrypted && (
                      <div className="grid grid-cols-2 gap-3">
                        {/* Fighter Card */}
                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-lg border border-primary/30">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide">
                              FIGHTER
                            </p>
                          </div>
                          <p className="text-3xl font-display font-black text-primary">
                            #{decrypted.candidateIndex}
                          </p>
                        </div>

                        {/* Stake Card */}
                        <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 p-4 rounded-lg border border-secondary/30">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-secondary"></div>
                            <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wide">
                              STAKE
                            </p>
                          </div>
                          <p className="text-3xl font-display font-black text-secondary">
                            {decrypted.stakeEth}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 font-display">ETH</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!showDecrypted && (
                  <div className="py-8 px-4 bg-muted/30 rounded-lg border border-dashed border-muted text-center">
                    <Lock className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-display font-medium text-muted-foreground">
                      BET HIDDEN
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-body">
                      Click "SHOW DETAILS" to decrypt
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Privacy Note */}
      <Card className="bg-primary/5 border-primary/20">
        <div className="p-4 flex items-center gap-3">
          <Lock className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-xs text-muted-foreground font-body">
            <strong className="font-display font-semibold text-foreground">PRIVATE BY DESIGN.</strong> Only you can decrypt your bets using your wallet.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MyBets;
