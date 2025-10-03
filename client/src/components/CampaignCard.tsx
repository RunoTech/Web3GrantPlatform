import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Heart, Target, CreditCard } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { generateCampaignShareLink } from "@/utils/share";
import { getCampaignUrl } from "@/utils/slug";
import ProgressiveImage from "@/components/enhanced/ProgressiveImage";
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
  const campaignUrl = getCampaignUrl(campaign.id, campaign.title);
  
  return (
    <Link href={campaignUrl}>
      <div 
        className="campaign-card group cursor-pointer"
        data-testid={`campaign-card-${campaign.id}`}
      >
        {/* Campaign Image - GoFundMe Style Side Image */}
        <div className="campaign-image relative">
          {campaign.imageUrl ? (
            <ProgressiveImage
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-full object-cover"
              placeholderClassName={bgClass}
              fallbackIcon={<Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />}
            />
          ) : (
            <div className={`w-full h-full ${bgClass} flex items-center justify-center`}>
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
            </div>
          )}
          {/* Campaign Type Badge - Bottom Left */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-black/80 text-white font-medium text-xs px-2.5 py-1.5 backdrop-blur-sm border-0">
              {campaign.campaignType === 'FUND' ? 'Company Fund' : 'Donation Campaign'}
            </Badge>
          </div>
          
          {/* Status Badges - Top Right with better spacing */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 max-w-[120px] sm:max-w-none">
            {campaign.featured && (
              <Badge className="bg-primary text-primary-foreground font-semibold text-xs px-2.5 py-1.5 shadow-lg border-0">
                Öne Çıkan
              </Badge>
            )}
            {campaign.creditCardEnabled && (
              <Badge className="bg-green-600 text-white font-semibold flex items-center gap-1.5 text-xs px-2.5 py-1.5 shadow-lg border-0">
                <CreditCard className="w-3 h-3" />
                <span className="hidden sm:inline whitespace-nowrap">Credit Card</span>
                <span className="sm:hidden">Card</span>
              </Badge>
            )}
          </div>
        </div>
        
        {/* Campaign Content - GoFundMe Style Right Side */}
        <div className="campaign-content justify-between">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              {/* Company info for FUND campaigns */}
              {campaign.campaignType === 'FUND' && campaign.companyName && (
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                    {campaign.companyName}
                  </Badge>
                </div>
              )}
              
              <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {campaign.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {campaign.description}
              </p>
            </div>
            
            {/* Amount Raised - GoFundMe Style Prominent Display */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="campaign-amount">
                  <div 
                    className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
                    style={{ fontSize: '1.875rem', fontWeight: '800', lineHeight: '1.2' }}
                    data-testid={`campaign-amount-${campaign.id}`}
                  >
                    ${parseFloat(campaign.totalDonations || "0").toLocaleString()}
                  </div>
                  <div 
                    className="text-lg font-medium text-muted-foreground"
                    style={{ fontSize: '1rem', fontWeight: '500' }}
                  >
                    <span className="text-primary font-semibold">USDT</span> raised
                  </div>
                </div>
              </div>
              
              {/* Progress Bar - GoFundMe Style */}
              <div 
                className="w-full bg-secondary rounded-full h-2.5 progress-bar"
                role="progressbar"
                aria-valuenow={Math.min((parseFloat(campaign.totalDonations || "0") / parseFloat(campaign.targetAmount || "1")) * 100, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                data-testid={`progress-bar-${campaign.id}`}
              >
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((parseFloat(campaign.totalDonations || "0") / parseFloat(campaign.targetAmount || "1")) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Bottom Info - Creator & Share */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-full flex-shrink-0"></div>
              <span className="text-xs text-muted-foreground font-mono">
                {campaign.ownerWallet.slice(0, 6)}...{campaign.ownerWallet.slice(-4)}
              </span>
            </div>
            <div onClick={(e) => e.preventDefault()}>
              <ShareButton 
                shareData={generateCampaignShareLink(campaign.id, campaign.title)}
                variant="ghost"
                size="sm"
                showText={false}
                className="h-8 w-8 p-0 hover:bg-accent"
                data-testid={`share-campaign-${campaign.id}`}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
