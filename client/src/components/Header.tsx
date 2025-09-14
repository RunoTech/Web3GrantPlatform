import { Link } from "wouter";
import WalletConnectButton from "@/components/WalletConnectButton";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";
import CryptoOnramp from "@/components/CryptoOnramp";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { Heart, User, Settings, BarChart3, Target, Trophy, Users, LogOut, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  currentPage?: string;
}

export default function Header({ currentPage }: HeaderProps) {
  const { t } = useLanguage();
  const { isConnected, disconnect } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container-main">
        <div className="flex items-center justify-between header-height">
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 btn-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <Link href="/">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground uppercase tracking-wide cursor-pointer hover:text-primary transition-colors">
                {t('duxxan')}
              </h1>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center max-w-3xl">
            <Link 
              href="/donations" 
              className={`nav-item font-semibold transition-colors duration-200 uppercase tracking-wide whitespace-nowrap ${
                currentPage === 'donations' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {t('donations')}
            </Link>
            <Link 
              href="/funds" 
              className={`nav-item font-semibold transition-colors duration-200 uppercase tracking-wide whitespace-nowrap ${
                currentPage === 'funds' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {t('funds')}
            </Link>
            <Link 
              href="/daily-rewards" 
              className={`nav-item font-semibold transition-colors duration-200 uppercase tracking-wide whitespace-nowrap ${
                currentPage === 'daily-rewards' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Daily Rewards
            </Link>
            <Link 
              href="/affiliate" 
              className={`nav-item font-semibold transition-colors duration-200 uppercase tracking-wide whitespace-nowrap ${
                currentPage === 'affiliate' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Affiliate
            </Link>
          </nav>

          <div className="flex items-center gap-4 flex-shrink-0">
            <CryptoOnramp />
            <ThemeToggle />
            <LanguageSelector />
            {isConnected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={`transition-colors hover:text-primary ${
                      currentPage === 'profile' 
                        ? 'text-primary' 
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={disconnect}
                    className="flex items-center w-full text-red-600 hover:text-red-700 focus:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <WalletConnectButton />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border">
            <nav className="px-4 py-4 space-y-3">
              <Link 
                href="/donations" 
                className={`block py-2 px-3 rounded-lg font-semibold transition-colors duration-200 uppercase tracking-wide ${
                  currentPage === 'donations' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-primary hover:bg-surface'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('donations')}
              </Link>
              <Link 
                href="/funds" 
                className={`block py-2 px-3 rounded-lg font-semibold transition-colors duration-200 uppercase tracking-wide ${
                  currentPage === 'funds' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-primary hover:bg-surface'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('funds')}
              </Link>
              <Link 
                href="/daily-rewards" 
                className={`block py-2 px-3 rounded-lg font-semibold transition-colors duration-200 uppercase tracking-wide ${
                  currentPage === 'daily-rewards' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-primary hover:bg-surface'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Daily Rewards
              </Link>
              <Link 
                href="/affiliate" 
                className={`block py-2 px-3 rounded-lg font-semibold transition-colors duration-200 uppercase tracking-wide ${
                  currentPage === 'affiliate' 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-primary hover:bg-surface'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Affiliate
              </Link>
              
              {isConnected && (
                <div className="pt-3 border-t border-border space-y-2">
                  <Link 
                    href="/profile" 
                    className="block py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-surface font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2 inline" />
                    Dashboard Overview
                  </Link>
                  <Link 
                    href="/profile?tab=campaigns" 
                    className="block py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-surface font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Target className="w-4 h-4 mr-2 inline" />
                    My Campaigns
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start py-2 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 font-semibold"
                    onClick={() => {
                      disconnect();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}