import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Send, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageSquare 
} from "lucide-react";
import { FaTelegram, FaWhatsapp } from "react-icons/fa";
import { 
  ShareData, 
  copyLinkToClipboard, 
  generateSocialMediaUrls, 
  openSocialShare 
} from "@/utils/share";

interface ShareButtonProps {
  shareData: ShareData;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  showText?: boolean;
}

export default function ShareButton({ 
  shareData, 
  variant = "outline", 
  size = "sm",
  className = "",
  showText = true 
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const socialUrls = generateSocialMediaUrls(shareData);
  
  const handleCopyLink = async () => {
    const success = await copyLinkToClipboard(shareData.url);
    if (success) {
      toast({
        title: "Link Copied!",
        description: "The link has been copied to your clipboard.",
        variant: "default"
      });
    } else {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      });
    }
    setIsOpen(false);
  };
  
  const handleSocialShare = (platform: string, url: string) => {
    openSocialShare(platform, url);
    setIsOpen(false);
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`transition-all duration-200 hover:scale-105 ${className}`}
          data-testid="button-share"
        >
          <Share2 className="w-4 h-4" />
          {showText && <span className="ml-1 hidden sm:inline">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-background border-border shadow-lg"
        data-testid="dropdown-share-menu"
      >
        {/* Copy Link */}
        <DropdownMenuItem 
          onClick={handleCopyLink}
          className="flex items-center space-x-2 hover:bg-muted transition-colors cursor-pointer"
          data-testid="share-copy-link"
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
          <span>Copy Link</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Social Media Platforms */}
        <DropdownMenuItem 
          onClick={() => handleSocialShare('twitter', socialUrls.twitter)}
          className="flex items-center space-x-2 hover:bg-muted transition-colors cursor-pointer"
          data-testid="share-twitter"
        >
          <Twitter className="w-4 h-4 text-blue-500" />
          <span>Twitter</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleSocialShare('facebook', socialUrls.facebook)}
          className="flex items-center space-x-2 hover:bg-muted transition-colors cursor-pointer"
          data-testid="share-facebook"
        >
          <Facebook className="w-4 h-4 text-blue-600" />
          <span>Facebook</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleSocialShare('linkedin', socialUrls.linkedin)}
          className="flex items-center space-x-2 hover:bg-muted transition-colors cursor-pointer"
          data-testid="share-linkedin"
        >
          <Linkedin className="w-4 h-4 text-blue-700" />
          <span>LinkedIn</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleSocialShare('telegram', socialUrls.telegram)}
          className="flex items-center space-x-2 hover:bg-muted transition-colors cursor-pointer"
          data-testid="share-telegram"
        >
          <FaTelegram className="w-4 h-4 text-blue-500" />
          <span>Telegram</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleSocialShare('whatsapp', socialUrls.whatsapp)}
          className="flex items-center space-x-2 hover:bg-muted transition-colors cursor-pointer"
          data-testid="share-whatsapp"
        >
          <FaWhatsapp className="w-4 h-4 text-green-500" />
          <span>WhatsApp</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleSocialShare('reddit', socialUrls.reddit)}
          className="flex items-center space-x-2 hover:bg-muted transition-colors cursor-pointer"
          data-testid="share-reddit"
        >
          <MessageSquare className="w-4 h-4 text-orange-500" />
          <span>Reddit</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}