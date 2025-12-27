import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake, Zap, Trophy, Check } from "lucide-react";
import { fighterProfiles, getElementColor } from "@/data/fighters";

interface FighterGridProps {
  onSelectFighter: (fighterId: number) => void;
  selectedFighter: number | null;
  disabled?: boolean;
  winningFighter?: number | null;
}

/**
 * FighterGrid Component - Cyberpunk Gaming Style
 *
 * Features:
 * - Neon gradient backgrounds
 * - Element-based color coding (fire, ice, lightning)
 * - Animated hover effects with glow
 * - Stats visualization
 * - Clear selection state
 */
const FighterGrid = ({ onSelectFighter, selectedFighter, disabled = false, winningFighter }: FighterGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {fighterProfiles.map((fighter) => {
        const isSelected = selectedFighter === fighter.id;
        const isWinner = winningFighter === fighter.id;
        const colors = getElementColor(fighter.element);

        return (
          <Card
            key={fighter.id}
            className={`group relative overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
              isSelected
                ? `${colors.border} shadow-lg ${colors.glow} scale-[1.02]`
                : `border-muted hover:${colors.border} hover:shadow-md`
            } bg-card/50 backdrop-blur-sm`}
            onClick={() => !disabled && onSelectFighter(fighter.id)}
          >
            {/* Selection Checkmark */}
            {isSelected && (
              <div className="absolute top-3 right-3 z-10">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors.primary} flex items-center justify-center shadow-lg`}>
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            {/* Winner Badge */}
            {isWinner && (
              <div className="absolute top-3 left-3 z-10">
                <Badge className="bg-yellow-500 text-yellow-950 gap-1 shadow-lg font-display">
                  <Trophy className="w-3 h-3" /> WINNER
                </Badge>
              </div>
            )}

            {/* Glow effect on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${colors.primary} blur-3xl`} />

            {/* Card Content */}
            <div className="relative p-6 space-y-5">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${colors.primary} flex items-center justify-center shadow-lg mb-3 transition-transform duration-300 ${
                  isSelected ? "scale-110" : "group-hover:scale-105"
                } ${colors.glow}`}>
                  {fighter.element === 'fire' && <Flame className="w-10 h-10 md:w-12 md:h-12 text-white" />}
                  {fighter.element === 'ice' && <Snowflake className="w-10 h-10 md:w-12 md:h-12 text-white" />}
                  {fighter.element === 'lightning' && <Zap className="w-10 h-10 md:w-12 md:h-12 text-white" />}
                </div>
                <h3 className="text-xl font-display font-bold text-center mb-1">{fighter.name}</h3>
                <Badge className={`${colors.bg} ${colors.text} border ${colors.border} font-display text-xs`}>
                  {fighter.title}
                </Badge>
              </div>

              {/* Stats Section */}
              <div className="space-y-2">
                {/* Power */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-display">PWR</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors.primary}`}
                        style={{ width: `${fighter.power}%` }}
                      />
                    </div>
                    <span className="text-xs font-display font-bold w-6">{fighter.power}</span>
                  </div>
                </div>
                {/* Speed */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-display">SPD</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors.primary}`}
                        style={{ width: `${fighter.speed}%` }}
                      />
                    </div>
                    <span className="text-xs font-display font-bold w-6">{fighter.speed}</span>
                  </div>
                </div>
                {/* Defense */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-display">DEF</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors.primary}`}
                        style={{ width: `${fighter.defense}%` }}
                      />
                    </div>
                    <span className="text-xs font-display font-bold w-6">{fighter.defense}</span>
                  </div>
                </div>
              </div>

              {/* Odds & Win Rate */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-muted">
                <div className={`text-center p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                  <p className="text-xs font-display text-muted-foreground mb-1">ODDS</p>
                  <p className={`text-2xl font-display font-black ${colors.text}`}>{fighter.odds}x</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-display text-muted-foreground mb-1">WIN RATE</p>
                  <p className="text-2xl font-display font-black">{fighter.winRate}%</p>
                </div>
              </div>

              {/* Hover Indicator */}
              {!isSelected && (
                <div className="pt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-muted-foreground font-display">CLICK TO SELECT</p>
                </div>
              )}
            </div>

            {/* Bottom Accent Bar (only when selected) */}
            {isSelected && (
              <div className={`h-1.5 bg-gradient-to-r ${colors.primary}`} />
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default FighterGrid;
