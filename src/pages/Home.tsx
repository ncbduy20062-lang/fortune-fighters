import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Swords, Shield, Zap, Lock, Trophy, Users, Flame, Snowflake } from "lucide-react";
import { fighterProfiles, getElementColor } from "@/data/fighters";

/**
 * Home Page - Fortune Fighters Landing
 * Cyberpunk gaming theme with neon accents
 */
const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px]" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm font-display text-primary">POWERED BY ZAMA FHE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black mb-6">
              <span className="text-foreground">ENCRYPTED</span>
              <br />
              <span className="text-primary text-glow">ARENA BATTLES</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body">
              Enter the arena and bet on legendary warriors. Your champion choice remains
              completely private with Fully Homomorphic Encryption.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/arena">
                <Button size="lg" className="font-display text-lg px-8 h-14 bg-primary hover:bg-primary/90 text-primary-foreground box-glow">
                  <Swords className="w-5 h-5 mr-2" />
                  ENTER ARENA
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="font-display text-lg px-8 h-14 border-primary/50 hover:bg-primary/10">
                  <Shield className="w-5 h-5 mr-2" />
                  HOW IT WORKS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-primary/20 bg-card/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-black text-primary mb-1">8.5K</div>
              <div className="text-sm text-muted-foreground font-display">TOTAL BETS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-black text-secondary mb-1">156</div>
              <div className="text-sm text-muted-foreground font-display">ETH WAGERED</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-black text-primary mb-1">3.2K</div>
              <div className="text-sm text-muted-foreground font-display">WARRIORS</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-black text-secondary mb-1">100%</div>
              <div className="text-sm text-muted-foreground font-display">ENCRYPTED</div>
            </div>
          </div>
        </div>
      </section>

      {/* Fighters Preview */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
              <span className="text-foreground">LEGENDARY</span>{" "}
              <span className="text-primary">WARRIORS</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Choose your champion wisely. Each fighter brings unique powers to the arena.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {fighterProfiles.map((fighter) => {
              const colors = getElementColor(fighter.element);
              return (
                <Card
                  key={fighter.id}
                  className={`relative overflow-hidden border-2 ${colors.border} bg-card/50 backdrop-blur-sm hover:scale-[1.02] transition-all duration-300 group`}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${colors.primary} blur-3xl`} />

                  <div className="relative p-6">
                    {/* Fighter Avatar */}
                    <div className="flex justify-center mb-6">
                      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${colors.primary} flex items-center justify-center shadow-lg ${colors.glow}`}>
                        {fighter.element === 'fire' && <Flame className="w-12 h-12 text-white" />}
                        {fighter.element === 'ice' && <Snowflake className="w-12 h-12 text-white" />}
                        {fighter.element === 'lightning' && <Zap className="w-12 h-12 text-white" />}
                      </div>
                    </div>

                    {/* Fighter Info */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-display font-bold mb-1">{fighter.name}</h3>
                      <p className={`text-sm ${colors.text} font-display`}>{fighter.title}</p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Power</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colors.primary}`}
                              style={{ width: `${fighter.power}%` }}
                            />
                          </div>
                          <span className="text-sm font-display font-bold">{fighter.power}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Speed</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colors.primary}`}
                              style={{ width: `${fighter.speed}%` }}
                            />
                          </div>
                          <span className="text-sm font-display font-bold">{fighter.speed}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Defense</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colors.primary}`}
                              style={{ width: `${fighter.defense}%` }}
                            />
                          </div>
                          <span className="text-sm font-display font-bold">{fighter.defense}</span>
                        </div>
                      </div>
                    </div>

                    {/* Odds */}
                    <div className={`mt-6 p-3 rounded-lg ${colors.bg} border ${colors.border} text-center`}>
                      <div className="text-xs text-muted-foreground mb-1 font-display">ODDS</div>
                      <div className={`text-2xl font-display font-black ${colors.text}`}>{fighter.odds}x</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link to="/arena">
              <Button size="lg" className="font-display px-8 h-12 bg-primary hover:bg-primary/90">
                <Zap className="w-5 h-5 mr-2" />
                PLACE YOUR BET
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30 border-y border-primary/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
              <span className="text-foreground">WHY</span>{" "}
              <span className="text-secondary">FORTUNE FIGHTERS?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 bg-card/50 border-primary/30 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2">100% ENCRYPTED</h3>
              <p className="text-muted-foreground font-body text-sm">
                Your bet choices are encrypted using Zama FHE before leaving your browser.
                No one can see who you bet on.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 border-secondary/30 hover:border-secondary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2">FAIR PAYOUTS</h3>
              <p className="text-muted-foreground font-body text-sm">
                Smart contracts automatically calculate and distribute winnings.
                No middlemen, no manipulation.
              </p>
            </Card>

            <Card className="p-6 bg-card/50 border-primary/30 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2">COMMUNITY DRIVEN</h3>
              <p className="text-muted-foreground font-body text-sm">
                Join thousands of warriors betting on their favorite champions.
                The more bets, the bigger the pool.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="p-10 md:p-16 bg-gradient-to-br from-primary/10 via-card to-secondary/10 border-primary/30 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-display font-black mb-4">
                READY TO <span className="text-primary text-glow">BATTLE?</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8 font-body">
                Connect your wallet and enter the arena. Your first encrypted bet awaits.
              </p>
              <Link to="/arena">
                <Button size="lg" className="font-display text-lg px-10 h-14 bg-primary hover:bg-primary/90 box-glow">
                  <Swords className="w-5 h-5 mr-2" />
                  ENTER THE ARENA
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
