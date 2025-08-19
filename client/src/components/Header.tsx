import { Link } from "wouter";
import WalletConnectButton from "@/components/WalletConnectButton";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import CryptoOnramp from "@/components/CryptoOnramp";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { Heart } from "lucide-react";

interface HeaderProps {
  currentPage?: string;
}

export default function Header({ currentPage }: HeaderProps) {
  const { t } = useLanguage();
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center neon-border">
              <Heart className="w-6 h-6 text-background" />
            </div>
            <Link href="/">
              <h1 className="text-xl font-bold text-foreground neon-text uppercase tracking-wide cursor-pointer">
                {t('duxxan')}
              </h1>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`font-medium transition-colors uppercase tracking-wide ${
                currentPage === 'home' 
                  ? 'text-cyber-cyan font-semibold' 
                  : 'text-muted-foreground hover:text-cyber-cyan'
              }`}
            >
              {t('duxxan')}
            </Link>
            <Link 
              href="/donations" 
              className={`font-medium transition-colors uppercase tracking-wide ${
                currentPage === 'donations' 
                  ? 'text-cyber-cyan font-semibold' 
                  : 'text-muted-foreground hover:text-cyber-cyan'
              }`}
            >
              {t('donations')}
            </Link>
            <Link 
              href="/funds" 
              className={`font-medium transition-colors uppercase tracking-wide ${
                currentPage === 'funds' 
                  ? 'text-cyber-cyan font-semibold' 
                  : 'text-muted-foreground hover:text-cyber-cyan'
              }`}
            >
              {t('funds')}
            </Link>
            {isConnected && (
              <Link 
                href="/profile" 
                className={`font-medium transition-colors uppercase tracking-wide ${
                  currentPage === 'profile' 
                    ? 'text-cyber-cyan font-semibold' 
                    : 'text-muted-foreground hover:text-cyber-cyan'
                }`}
              >
                {t('profile')}
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <CryptoOnramp />
            <ThemeToggle />
            <LanguageSelector />
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}