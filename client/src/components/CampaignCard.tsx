import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Target } from "lucide-react";
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
        {/* Campaign Image - OpenSea Style 1:1 Aspect Ratio */}
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
              <Heart className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            {campaign.featured ? (
              <Badge className="bg-primary text-primary-foreground font-semibold">
                Öne Çıkan
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-semibold">
                Aktif
              </Badge>
            )}
          </div>
        </div>
        
        {/* Campaign Content - Professional Layout */}
        <div className="campaign-content">
          <div className="p-4 space-y-3">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {campaign.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {campaign.description}
            </p>
            
            {/* Professional Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Toplanan</p>
                  <p className="text-sm font-semibold text-foreground">{parseFloat(campaign.totalDonations || "0").toFixed(2)} USDT</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Destekçi</p>
                  <p className="text-sm font-semibold text-foreground">{campaign.donationCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fixed Action Bar - OpenSea Style */}
          <div className="campaign-actions">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex-shrink-0"></div>
                <span className="text-xs text-muted-foreground font-mono truncate">
                  {campaign.ownerWallet.slice(0, 6)}...{campaign.ownerWallet.slice(-4)}
                </span>
              </div>
              {/* Professional Share Button */}
              <div onClick={(e) => e.preventDefault()}>
                <ShareButton 
                  shareData={generateCampaignShareLink(campaign.id, campaign.title)}
                  variant="ghost"
                  size="sm"
                  showText={false}
                  className="h-8 w-8 p-0 hover:bg-accent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
