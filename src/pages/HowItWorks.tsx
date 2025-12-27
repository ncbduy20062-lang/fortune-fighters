import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lock,
  Wallet,
  Swords,
  Send,
  Trophy,
  Shield,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";

/**
 * How It Works Page - Explains FHE encryption and betting flow
 * Cyberpunk gaming theme
 */
const HowItWorks = () => {
  const steps = [
    {
      icon: Wallet,
      title: "CONNECT WALLET",
      description: "Connect your MetaMask or WalletConnect compatible wallet to the Sepolia testnet.",
      color: "primary",
    },
    {
      icon: Swords,
      title: "CHOOSE CHAMPION",
      description: "Select the fighter you believe will win the arena battle.",
      color: "secondary",
    },
    {
      icon: Lock,
      title: "ENCRYPT BET",
      description: "Your choice and stake are encrypted in your browser using Zama FHE before being sent to the blockchain.",
      color: "primary",
    },
    {
      icon: Send,
      title: "SUBMIT TO CHAIN",
      description: "The encrypted data is submitted to the smart contract. No one can see who you bet on.",
      color: "secondary",
    },
    {
      icon: Trophy,
      title: "CLAIM WINNINGS",
      description: "After the battle, winners can claim their share of the pool. Payouts are calculated on encrypted data.",
      color: "primary",
    },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-4xl">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 font-display"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO HOME
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-display font-black mb-4">
            <span className="text-foreground">HOW IT</span>{" "}
            <span className="text-primary text-glow">WORKS</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body">
            Fortune Fighters uses Fully Homomorphic Encryption (FHE) to ensure your betting choices
            remain completely private on the blockchain.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-16">
          {steps.map((step, index) => (
            <Card
              key={index}
              className={`p-6 bg-card/50 border-2 ${
                step.color === "primary" ? "border-primary/30" : "border-secondary/30"
              } backdrop-blur-sm`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    step.color === "primary"
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/20 text-secondary"
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-xs font-display font-bold ${
                        step.color === "primary" ? "text-primary" : "text-secondary"
                      }`}
                    >
                      STEP {index + 1}
                    </span>
                    <h3 className="text-lg font-display font-bold">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground font-body">{step.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* FHE Section */}
        <Card className="p-8 bg-gradient-to-br from-primary/10 via-card to-secondary/10 border-primary/30 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-black mb-4">
              <span className="text-foreground">WHAT IS</span>{" "}
              <span className="text-primary">FHE?</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Fully Homomorphic Encryption allows computations on encrypted data without
              ever decrypting it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-card/50 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <EyeOff className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold">YOUR BET STAYS PRIVATE</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Neither the smart contract, nor other users, nor even the blockchain explorers
                can see which fighter you bet on or how much you wagered.
              </p>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-secondary/20">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-secondary" />
                <h3 className="font-display font-bold">VERIFIABLE FAIRNESS</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                The smart contract can compute winning totals and payouts on encrypted data,
                ensuring fair distribution without revealing individual bets.
              </p>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold">ONLY YOU CAN DECRYPT</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Your wallet holds the key to decrypt your bet data. You control when and
                if you want to reveal your betting history.
              </p>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-secondary/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-secondary" />
                <h3 className="font-display font-bold">POWERED BY ZAMA</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                We use Zama's fhEVM, the leading FHE implementation for Ethereum, to provide
                battle-tested privacy guarantees.
              </p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-xl font-display font-bold mb-4">READY TO TRY?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/arena">
              <Button size="lg" className="font-display px-8 h-12 bg-primary hover:bg-primary/90 box-glow">
                <Swords className="w-5 h-5 mr-2" />
                ENTER ARENA
              </Button>
            </Link>
            <a
              href="https://docs.zama.ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="font-display px-8 h-12 border-primary/50 hover:bg-primary/10">
                READ ZAMA DOCS
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
