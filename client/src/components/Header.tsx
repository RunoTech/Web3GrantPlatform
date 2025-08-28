import { Link } from "wouter";
import WalletConnectButton from "@/components/WalletConnectButton";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import CryptoOnramp from "@/components/CryptoOnramp";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { Heart, User, Settings, BarChart3, Target, Trophy, LogOut, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
              <Heart className="w-6 h-6 icon-on-primary" />
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
            <Link 
              href="/daily-rewards" 
              className={`font-medium transition-colors uppercase tracking-wide ${
                currentPage === 'daily-rewards' 
                  ? 'text-cyber-cyan font-semibold' 
                  : 'text-muted-foreground hover:text-cyber-cyan'
              }`}
            >
              Daily Rewards
            </Link>
            {isConnected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={`transition-colors hover:text-cyber-cyan ${
                      currentPage === 'profile' 
                        ? 'text-cyber-cyan' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Dashboard Overview
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=campaigns" className="flex items-center w-full">
                      <Target className="w-4 h-4 mr-2" />
                      My Campaigns
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=rewards" className="flex items-center w-full">
                      <Trophy className="w-4 h-4 mr-2" />
                      Daily Rewards
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=settings" className="flex items-center w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <CryptoOnramp />
            <ThemeToggle />
            <LanguageSelector />
            {isConnected && (
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {isConnected ? 'U' : '?'}
                </AvatarFallback>
              </Avatar>
            )}
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}