import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Target } from "lucide-react";
import type { Campaign } from "@shared/schema";

interface CampaignCardProps {
  campaign: Campaign;
}

const pastelBackgrounds = [
  'bg-pastel-blue',
  'bg-pastel-purple', 
  'bg-pastel-cream',
  'bg-pastel-green',
  'bg-pastel-orange'
];

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const bgClass = pastelBackgrounds[campaign.id % pastelBackgrounds.length];
  
  return (
    <Link href={`/campaign/${campaign.id}`}>
      <div 
        className={`group bg-white dark:bg-gray-900 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer`}
        data-testid={`campaign-card-${campaign.id}`}
      >
        {/* Campaign Image */}
        <div className="relative h-48">
          {campaign.imageUrl ? (
            <img 
              src={campaign.imageUrl} 
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${bgClass} flex items-center justify-center`}>
              <Heart className="w-16 h-16 text-gray-600 dark:text-gray-300" />
            </div>
          )}
          <div className="absolute top-4 right-4">
            {campaign.featured ? (
              <Badge className="bg-pastel-orange text-orange-800">
                Öne Çıkan
              </Badge>
            ) : (
              <Badge className="bg-pastel-green text-green-800">
                Aktif
              </Badge>
            )}
          </div>
        </div>
        
        {/* Campaign Content */}
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-2">
            {campaign.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
            {campaign.description}
          </p>
          
          {/* Campaign Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Toplanan</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{parseFloat(campaign.totalDonations || "0").toFixed(2)} USDT</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div className="space-y-1 text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Destekçi</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{campaign.donationCount}</p>
              </div>
            </div>
          </div>
          
          {/* Owner Info */}
          <div className="flex items-center space-x-2 pt-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
            <span className="text-xs text-slate-500 font-mono">
              {campaign.ownerWallet.slice(0, 6)}...{campaign.ownerWallet.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
