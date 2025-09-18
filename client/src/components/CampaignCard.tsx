import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Target, CreditCard } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { generateCampaignShareLink } from "@/utils/share";
import type { Campaign } from "@shared/schema";

interface CampaignCardProps {
  campaign: Campaign;
}

// Professional color system for placeholders
const professionalBackgrounds = [
  'bg-primary/10 text-primary',
  'bg-secondary/10 text-secondary-foreground', 
  'bg-muted/20 text-muted-foreground',
  'bg-accent/10 text-accent-foreground',
  'bg-card text-card-foreground'
];

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const bgClass = professionalBackgrounds[campaign.id % professionalBackgrounds.length];
  
  return (
    <Link href={`/campaign/${campaign.id}`}>
      <div 
        className="campaign-card group cursor-pointer"
        data-testid={`campaign-card-${campaign.id}`}
      >
        {/* Campaign Image - Mobile-Optimized 1:1 Aspect Ratio */}
        <div className="campaign-image relative">
          {campaign.imageUrl ? (
            <img 
              src={campaign.imageUrl} 
              alt={campaign.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full ${bgClass} flex items-center justify-center`}>
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
            </div>
          )}
          {/* Mobile-optimized badges with better touch spacing */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            {campaign.featured && (
              <Badge className="bg-primary text-primary-foreground font-semibold text-xs px-2 py-1 shadow-sm">
                Öne Çıkan
              </Badge>
            )}
            {campaign.creditCardEnabled ? (
              <Badge className="bg-green-600 text-white font-semibold flex items-center gap-1 text-xs px-2 py-1 shadow-sm">
                <CreditCard className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Pay with Credit Card</span>
                <span className="sm:hidden">Credit Card</span>
              </Badge>
            ) : (
              !campaign.featured && (
                <Badge variant="secondary" className="font-semibold text-xs px-2 py-1 shadow-sm">
                  Aktif
                </Badge>
              )
            )}
          </div>
        </div>
        
        {/* Campaign Content - Mobile-Optimized Layout */}
        <div className="campaign-content">
          <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {campaign.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {campaign.description}
            </p>
            
            {/* Mobile-Optimized Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Toplanan</p>
                  <p className="text-sm font-semibold text-foreground truncate">{parseFloat(campaign.totalDonations || "0").toFixed(2)} USDT</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Destekçi</p>
                  <p className="text-sm font-semibold text-foreground truncate">{campaign.donationCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile-Optimized Action Bar */}
          <div className="campaign-actions">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {campaign.ownerWallet.slice(0, 6)}...{campaign.ownerWallet.slice(-4)}
                </span>
              </div>
              {/* Mobile-Optimized Share Button */}
              <div onClick={(e) => e.preventDefault()} className="flex-shrink-0">
                <ShareButton 
                  shareData={generateCampaignShareLink(campaign.id, campaign.title)}
                  variant="ghost"
                  size="sm"
                  showText={false}
                  className="h-11 w-11 p-0 hover:bg-accent touch-manipulation min-h-11 min-w-11"
                  data-testid={`share-campaign-${campaign.id}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
