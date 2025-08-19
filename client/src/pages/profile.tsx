import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import WalletConnectButton from "@/components/WalletConnectButton";
import CampaignCard from "@/components/CampaignCard";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  User, 
  Heart, 
  TrendingUp, 
  Award, 
  Calendar,
  Wallet,
  DollarSign,
  Target,
  Users,
  ArrowLeft,
  Crown,
  Gift
} from "lucide-react";
import type { Campaign } from "@shared/schema";

export default function ProfilePage() {
  const { isConnected, address } = useWallet();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  // Force dark mode for this page
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = '#000000';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/get-campaigns"],
    enabled: isConnected,
  });

  const { data: dailyEntries = [] } = useQuery({
    queryKey: ["/api/get-daily-entries", address],
    enabled: isConnected && !!address,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-10 max-w-lg mx-auto p-8">
            <div className="w-40 h-40 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto p-1 relative">
              <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                <Wallet className="w-20 h-20 text-cyan-400" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl animate-pulse opacity-20"></div>
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-white font-mono uppercase tracking-wider">{t('profile.access_title')}</h1>
              <p className="text-xl text-gray-400 leading-relaxed">
                {t('profile.connect_wallet_message')}
              </p>
            </div>
            <WalletConnectButton />
            <Button variant="ghost" asChild className="mt-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 font-mono uppercase tracking-wider">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back_to_home')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const userCampaigns = campaigns.filter((c: Campaign) => c.ownerWallet === address);
  const totalDonationsReceived = userCampaigns.reduce((sum: number, c: Campaign) => sum + (c.totalDonations || 0), 0);
  const totalSupporters = userCampaigns.reduce((sum: number, c: Campaign) => sum + (c.donationCount || 0), 0);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a1a 100%)',
      position: 'relative'
    }}>
      {/* Animated Background Grid */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
        zIndex: 1
      }}></div>

      {/* Cyber Header with Neon Effects */}
      <header style={{ 
        background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(10,10,26,0.95) 50%, rgba(0,0,0,0.95) 100%)',
        borderBottom: '2px solid transparent',
        borderImage: 'linear-gradient(90deg, #00d4ff, #ff00ff, #00d4ff) 1',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 212, 255, 0.2)'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center" style={{ height: '90px' }}>
            {/* DUXXAN Logo with Neon Effect */}
            <Link href="/" style={{
              fontSize: '2.5rem',
              fontWeight: '900',
              background: 'linear-gradient(45deg, #00d4ff, #ff00ff, #00ff88)',
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '0.2em',
              fontFamily: "'Orbitron', monospace",
              textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
              animation: 'gradient 3s ease infinite, glow 2s ease-in-out infinite alternate'
            }}>
              DUXXAN
            </Link>
            
            {/* Status & Wallet */}
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-3" style={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: '25px',
                padding: '8px 16px'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  background: 'radial-gradient(circle, #00ff88, #00d4ff)',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s infinite',
                  boxShadow: '0 0 10px #00ff88'
                }}></div>
                <span style={{
                  fontSize: '0.8rem',
                  fontFamily: "'Orbitron', monospace",
                  color: '#00d4ff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: '600'
                }}>NEURAL LINK ACTIVE</span>
              </div>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12" style={{ position: 'relative', zIndex: 10 }}>
        {/* Back Button with Holographic Effect */}
        <Button variant="ghost" asChild className="mb-12" data-testid="button-back-home" style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 255, 0.1))',
          border: '1px solid rgba(0, 212, 255, 0.5)',
          borderRadius: '20px',
          color: '#00d4ff',
          fontFamily: "'Orbitron', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '12px 24px',
          fontSize: '0.9rem',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(0, 212, 255, 0.2)'
        }}>
          <Link href="/">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('common.back_to_home')}
          </Link>
        </Button>

        {/* Holographic Profile Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 0, 255, 0.05), rgba(0, 255, 136, 0.05))',
          border: '2px solid transparent',
          borderImage: 'linear-gradient(135deg, #00d4ff, #ff00ff, #00ff88) 1',
          borderRadius: '25px',
          padding: '40px',
          marginBottom: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated Background Effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'conic-gradient(from 0deg, transparent, rgba(0, 212, 255, 0.03), transparent, rgba(255, 0, 255, 0.03), transparent)',
            animation: 'rotate 20s linear infinite',
            pointerEvents: 'none'
          }}></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-8 lg:space-y-0 lg:space-x-12" style={{ position: 'relative', zIndex: 1 }}>
            {/* Holographic Avatar */}
            <div className="relative">
              <div style={{
                width: '140px',
                height: '140px',
                background: 'linear-gradient(45deg, #00d4ff, #ff00ff, #00ff88)',
                borderRadius: '50%',
                padding: '3px',
                animation: 'pulse 3s ease-in-out infinite'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle at 30% 30%, rgba(0, 212, 255, 0.2), rgba(0, 0, 0, 0.9))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 212, 255, 0.3)'
                }}>
                  <span style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    fontFamily: "'Orbitron', monospace",
                    textShadow: '0 0 20px rgba(0, 212, 255, 0.8)'
                  }}>
                    {address?.slice(2, 4).toUpperCase()}
                  </span>
                </div>
              </div>
              
              {/* Elite Badge */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                width: '40px',
                height: '40px',
                background: 'linear-gradient(45deg, #ffaa00, #ff6600)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #000',
                boxShadow: '0 0 15px rgba(255, 170, 0, 0.6)'
              }}>
                <Crown className="w-5 h-5" style={{ color: '#000' }} />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 style={{
                  fontSize: '3rem',
                  fontWeight: '900',
                  background: 'linear-gradient(45deg, #00d4ff, #ff00ff, #00ff88)',
                  backgroundSize: '300% 300%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  marginBottom: '16px',
                  letterSpacing: '0.1em',
                  fontFamily: "'Orbitron', monospace",
                  animation: 'gradient 4s ease infinite'
                }}>{t('profile.my_profile')}</h1>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* Wallet Address */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 255, 0.1))',
                    border: '1px solid rgba(0, 212, 255, 0.4)',
                    borderRadius: '15px',
                    padding: '12px 20px'
                  }}>
                    <span style={{
                      color: '#00d4ff',
                      fontFamily: "'Fira Code', monospace",
                      fontSize: '0.9rem',
                      letterSpacing: '0.05em'
                    }}>
                      {address?.slice(0, 16)}...{address?.slice(-12)}
                    </span>
                  </div>
                  
                  {/* Verification Badge */}
                  <div className="flex items-center space-x-2" style={{
                    background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
                    border: '1px solid rgba(0, 255, 136, 0.4)',
                    borderRadius: '15px',
                    padding: '8px 16px'
                  }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      background: 'radial-gradient(circle, #00ff88, #00d4ff)',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite',
                      boxShadow: '0 0 10px #00ff88'
                    }}></div>
                    <span style={{
                      fontSize: '0.8rem',
                      fontFamily: "'Orbitron', monospace",
                      color: '#00ff88',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: '600'
                    }}>NEURAL VERIFIED</span>
                  </div>
                </div>
              </div>
              
              {/* Holographic Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Target, value: userCampaigns.length, label: t('profile.campaigns'), color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)' },
                  { icon: DollarSign, value: totalDonationsReceived.toFixed(3), label: t('profile.eth_raised'), color: '#00ff88', bg: 'rgba(0, 255, 136, 0.1)' },
                  { icon: Users, value: totalSupporters, label: t('profile.supporters'), color: '#ff00ff', bg: 'rgba(255, 0, 255, 0.1)' },
                  { icon: Gift, value: dailyEntries.length, label: t('profile.daily_participation'), color: '#ffaa00', bg: 'rgba(255, 170, 0, 0.1)' }
                ].map((stat, index) => (
                  <div key={index} style={{
                    background: `linear-gradient(135deg, ${stat.bg}, rgba(0, 0, 0, 0.2))`,
                    border: `1px solid ${stat.color}40`,
                    borderRadius: '20px',
                    padding: '24px',
                    textAlign: 'center',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }} className="group hover:scale-105">
                    {/* Hover Effect */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, ${stat.color}20, transparent)`,
                      transition: 'left 0.5s ease',
                      pointerEvents: 'none'
                    }} className="group-hover:left-full"></div>
                    
                    <stat.icon className="w-10 h-10 mx-auto mb-4" style={{ color: stat.color }} />
                    <p style={{
                      fontSize: '2.5rem',
                      fontWeight: '900',
                      color: '#ffffff',
                      marginBottom: '8px',
                      fontFamily: "'Orbitron', monospace",
                      textShadow: `0 0 10px ${stat.color}50`
                    }}>{stat.value}</p>
                    <p style={{
                      fontSize: '0.8rem',
                      color: stat.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontFamily: "'Orbitron', monospace",
                      fontWeight: '600'
                    }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Holographic Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 0, 255, 0.05))',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: '25px',
            padding: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            {[
              { value: 'overview', label: t('profile.overview') },
              { value: 'campaigns', label: t('profile.my_campaigns') },
              { value: 'rewards', label: t('profile.daily_rewards') }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  background: activeTab === tab.value 
                    ? 'linear-gradient(45deg, #00d4ff, #ff00ff)' 
                    : 'transparent',
                  border: activeTab === tab.value 
                    ? 'none' 
                    : '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: '20px',
                  padding: '16px 24px',
                  color: activeTab === tab.value ? '#000' : '#00d4ff',
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className="hover:scale-105"
              >
                {activeTab === tab.value && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
                    borderRadius: '20px',
                    zIndex: -1,
                    boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)'
                  }}></div>
                )}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab - Cyber Style */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-400/50 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg text-white">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span className="font-mono uppercase tracking-wider">{t('profile.campaign_performance')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wide">{t('profile.most_successful')}</span>
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 font-mono">
                      {userCampaigns.length > 0 ? 
                        userCampaigns.reduce((a, b) => (a.totalDonations || 0) > (b.totalDonations || 0) ? a : b).title.slice(0, 12) + '...' : 
                        t('profile.none_yet')
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wide">{t('profile.average_donation')}</span>
                    <span className="font-mono text-white font-bold">
                      {totalSupporters > 0 ? (totalDonationsReceived / totalSupporters).toFixed(3) : '0.000'} ETH
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-400/50 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg text-white">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <span className="font-mono uppercase tracking-wider">{t('profile.activity')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wide">{t('profile.this_month_participation')}</span>
                    <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono">
                      {dailyEntries.filter((e: any) => new Date(e.date).getMonth() === new Date().getMonth()).length} {t('profile.days')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wide">{t('profile.last_campaign')}</span>
                    <span className="text-white font-mono text-sm">
                      {userCampaigns.length > 0 ? 
                        new Date(userCampaigns[userCampaigns.length - 1].createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US') : 
                        t('profile.none_yet')
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border border-yellow-500/20 backdrop-blur-sm hover:border-yellow-400/50 transition-all">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg text-white">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="font-mono uppercase tracking-wider">{t('profile.achievements')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    {userCampaigns.length >= 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-green-400 font-mono text-sm uppercase tracking-wider">{t('profile.first_campaign')}</span>
                      </div>
                    )}
                    {totalSupporters >= 10 && (
                      <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">{t('profile.ten_supporters')}</span>
                      </div>
                    )}
                    {dailyEntries.length >= 7 && (
                      <div className="flex items-center space-x-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <Award className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-purple-400 font-mono text-sm uppercase tracking-wider">{t('profile.weekly_participation')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Campaigns Tab - Cyber Style */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-wider">{t('profile.my_campaigns')}</h2>
              <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono uppercase tracking-wider hover:from-cyan-400 hover:to-purple-500 border border-cyan-500/30">
                <Link href="/funds">
                  <Target className="w-4 h-4 mr-2" />
                  {t('profile.new_campaign')}
                </Link>
              </Button>
            </div>
            
            {userCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCampaigns.map((campaign: Campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 p-1">
                  <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                    <Target className="w-16 h-16 text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-4 font-mono uppercase tracking-wider">
                  {t('profile.no_campaigns_yet')}
                </h3>
                <p className="text-gray-400 mb-10 max-w-md mx-auto">
                  {t('profile.create_first_campaign')}
                </p>
                <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono uppercase tracking-wider hover:from-cyan-400 hover:to-purple-500 px-8 py-3">
                  <Link href="/funds">
                    {t('profile.create_campaign')}
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Daily Rewards Tab - Cyber Style */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-10 backdrop-blur-sm">
              <div className="text-center space-y-8">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto p-1 relative">
                  <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                    <Gift className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl animate-pulse opacity-20"></div>
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-white mb-4 font-mono uppercase tracking-wider">{t('profile.daily_reward_participation')}</h2>
                  <p className="text-xl text-gray-400">
                    {t('profile.total_participation_days').replace('{{days}}', dailyEntries.length.toString())}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <div className="text-center p-8 bg-gray-800/50 border border-green-500/20 rounded-xl hover:border-green-400/50 transition-all">
                    <Calendar className="w-10 h-10 text-green-400 mx-auto mb-4" />
                    <p className="text-4xl font-bold text-white mb-2">{dailyEntries.length}</p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-mono">{t('profile.total_participation')}</p>
                  </div>
                  <div className="text-center p-8 bg-gray-800/50 border border-orange-500/20 rounded-xl hover:border-orange-400/50 transition-all">
                    <TrendingUp className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                    <p className="text-4xl font-bold text-white mb-2">
                      {dailyEntries.filter((e: any) => new Date(e.date).getMonth() === new Date().getMonth()).length}
                    </p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-mono">{t('profile.this_month')}</p>
                  </div>
                  <div className="text-center p-8 bg-gray-800/50 border border-purple-500/20 rounded-xl hover:border-purple-400/50 transition-all">
                    <Award className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                    <p className="text-4xl font-bold text-white mb-2">0.00</p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-mono">{t('profile.earned_rewards')}</p>
                  </div>
                </div>
                
                <Button asChild className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-mono uppercase tracking-wider hover:from-cyan-400 hover:to-purple-500 px-8 py-4 text-lg mt-8">
                  <Link href="/#odul-sistemi">
                    {t('profile.join_today')}
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}