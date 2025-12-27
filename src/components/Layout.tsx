import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Swords, Zap, Shield } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout wrapper for Fortune Fighters
 * Cyberpunk gaming theme with neon accents
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col cyber-grid">
      {/* Header with Wallet Connect */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-primary/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Swords className="w-8 h-8 text-primary group-hover:text-secondary transition-colors" />
              <div className="absolute inset-0 blur-lg bg-primary/50 group-hover:bg-secondary/50 transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold text-primary group-hover:text-glow-sm transition-all">
                FORTUNE
              </span>
              <span className="text-xs font-display tracking-[0.3em] text-secondary -mt-1">
                FIGHTERS
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="px-4 py-2 text-sm font-display font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
            >
              HOME
            </Link>
            <Link
              to="/arena"
              className="px-4 py-2 text-sm font-display font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              ARENA
            </Link>
            <Link
              to="/how-it-works"
              className="px-4 py-2 text-sm font-display font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              HOW IT WORKS
            </Link>
          </nav>

          {/* Wallet Connect */}
          <div className="flex items-center gap-4">
            <ConnectButton
              accountStatus="address"
              chainStatus="icon"
              showBalance={false}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-card/50 backdrop-blur-xl border-t border-primary/20 py-8 mt-auto">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-primary" />
              <div>
                <span className="text-lg font-display font-bold text-primary">
                  FORTUNE FIGHTERS
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Encrypted arena battles powered by FHE
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="flex gap-6 text-sm font-display">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                HOME
              </Link>
              <Link to="/arena" className="text-muted-foreground hover:text-primary transition-colors">
                ARENA
              </Link>
              <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                HOW IT WORKS
              </Link>
              <a
                href="https://docs.zama.ai/fhevm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-secondary transition-colors"
              >
                DOCS
              </a>
            </div>

            {/* Tech badges */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-display text-primary">
                ZAMA FHE
              </div>
              <div className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-xs font-display text-secondary">
                SEPOLIA
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-6 font-display">
            © 2024 FORTUNE FIGHTERS. ALL BETS ARE ENCRYPTED ON-CHAIN.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
