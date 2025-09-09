import { Link } from "wouter";
import WalletConnectButton from "@/components/WalletConnectButton";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import CryptoOnramp from "@/components/CryptoOnramp";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { Heart, User, Settings, BarChart3, Target, Trophy, Users, LogOut, ChevronDown } from "lucide-react";
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
              <Heart className="w-6 h-6 text-black" />
            </div>
            <Link href="/">
              <h1 className="text-xl font-bold text-foreground neon-text uppercase tracking-wide cursor-pointer">
                {t('duxxan')}
              </h1>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-12">
            <Link 
              href="/donations" 
              className={`font-semibold transition-colors duration-200 uppercase tracking-wide whitespace-nowrap ${
                currentPage === 'donations' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {t('donations')}
            </Link>
            <Link 
              href="/funds" 
              className={`font-semibold transition-colors duration-200 uppercase tracking-wide whitespace-nowrap ${
                currentPage === 'funds' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {t('funds')}
            </Link>
            <Link 
              href="/daily-rewards" 
              className={`font-semibold transition-colors duration-200 uppercase tracking-wide whitespace-nowrap ${
                currentPage === 'daily-rewards' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Daily Rewards
            </Link>
            <Link 
              href="/affiliate" 
              className={`font-semibold transition-colors duration-200 uppercase tracking-wide whitespace-nowrap ${
                currentPage === 'affiliate' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Affiliate
            </Link>
          </nav>

          <div className="flex items-center space-x-6">
            <CryptoOnramp />
            <ThemeToggle />
            <LanguageSelector />
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
                  <DropdownMenuItem asChild>
                    <Link href="/affiliate" className="flex items-center w-full">
                      <Users className="w-4 h-4 mr-2" />
                      Affiliate Program
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
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}