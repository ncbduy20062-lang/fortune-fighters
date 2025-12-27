import { useState } from "react";
import FighterGrid from "@/components/arena/FighterGrid";
import BetPanel from "@/components/arena/BetPanel";
import MyBets from "@/components/arena/MyBets";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Shield, Users, Timer, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { getFighterById } from "@/data/fighters";

/**
 * Arena Page - Main betting interface
 * Cyberpunk gaming theme with neon accents
 */
const Arena = () => {
  const [selectedFighter, setSelectedFighter] = useState<number | null>(null);
  const selectedFighterData = selectedFighter !== null ? getFighterById(selectedFighter) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 py-6 md:py-12">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6 font-display"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK TO HOME
          </Link>

          {/* Hero Section */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-black mb-2">
                <span className="text-foreground">BATTLE</span>{" "}
                <span className="text-primary text-glow">ARENA</span>
              </h1>
              <p className="text-muted-foreground font-display">
                ENCRYPTED • SECURE • FAIR
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <div>
                  <div className="font-display font-bold">12.8K</div>
                  <div className="text-xs text-muted-foreground font-display">BETS</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-secondary" />
                <div>
                  <div className="font-display font-bold">127</div>
                  <div className="text-xs text-muted-foreground font-display">DAYS LEFT</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Fighters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-sm font-display font-medium text-muted-foreground">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </span>
              CHOOSE YOUR CHAMPION
            </div>

            <FighterGrid
              onSelectFighter={setSelectedFighter}
              selectedFighter={selectedFighter}
            />

            {/* Privacy Badge */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-display font-semibold">END-TO-END ENCRYPTION</p>
                  <p className="text-xs text-muted-foreground font-body">
                    Your choice is encrypted in browser using Zama FHE. Only you can decrypt your bet.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Bet Form */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Step Indicator */}
              <div className="flex items-center gap-2 text-sm font-display font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                  2
                </span>
                PLACE YOUR BET
              </div>

              <BetPanel
                fighterId={selectedFighter}
                fighterName={selectedFighterData?.name}
              />
            </div>
          </div>
        </div>

        {/* My Bets Section */}
        <div className="mt-12 md:mt-16">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 text-sm font-display font-medium text-muted-foreground mb-6">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              3
            </span>
            TRACK YOUR BETS
          </div>

          <MyBets />
        </div>
      </div>
    </div>
  );
};

export default Arena;
