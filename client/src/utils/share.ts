// Dynamic social media sharing utilities for duxxan.com

// Get base URL from environment or use current origin as fallback
const BASE_URL = import.meta.env.VITE_BASE_URL || 
                 (typeof window !== 'undefined' ? window.location.origin : 'https://duxxan.com');

export interface ShareData {
  title: string;
  description: string;
  url: string;
  hashtags?: string[];
}

// Generate campaign share link
export function generateCampaignShareLink(campaignId: number | string, campaignTitle?: string): ShareData {
  const url = `${BASE_URL}/campaign/${campaignId}`;
  const title = campaignTitle ? `${campaignTitle} - DUXXAN` : 'Support this campaign on DUXXAN';
  const description = 'Join the next-generation blockchain donation platform. Commission-free donations with direct wallet-to-wallet transfers on Ethereum network.';
  
  return {
    title,
    description,
    url,
    hashtags: ['DUXXAN', 'Blockchain', 'Donation', 'Crypto', 'Ethereum', 'Web3']
  };
}

// Generate donation share link (for sharing a completed donation)
export function generateDonationShareLink(campaignId: number | string, donationAmount?: number): ShareData {
  const url = `${BASE_URL}/campaign/${campaignId}`;
  const amountText = donationAmount ? `${donationAmount} USDT` : '';
  const title = `I just donated ${amountText} on DUXXAN! 💙`;
  const description = 'Join me in supporting great causes on the next-generation blockchain donation platform. Commission-free donations with direct transfers.';
  
  return {
    title,
    description,
    url,
    hashtags: ['DUXXAN', 'Donation', 'Crypto', 'GoodCause', 'Ethereum', 'Blockchain']
  };
}


// Generate fund/investment share link
export function generateFundShareLink(campaignId: number | string, companyName?: string): ShareData {
  const url = `${BASE_URL}/funds/${campaignId}`;
  const title = companyName ? `${companyName} - Investment Opportunity on DUXXAN` : 'Investment Opportunity on DUXXAN';
  const description = 'Discover investment opportunities on the next-generation blockchain platform. Secure, transparent, and commission-free funding.';
  
  return {
    title,
    description,
    url,
    hashtags: ['DUXXAN', 'Investment', 'Blockchain', 'Funding', 'Startup', 'Crypto']
  };
}

// Copy link to clipboard
export async function copyLinkToClipboard(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Modern Clipboard API
      await navigator.clipboard.writeText(url);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy link:', error);
    return false;
  }
}

// Generate social media sharing URLs
export function generateSocialMediaUrls(shareData: ShareData) {
  const { title, description, url, hashtags } = shareData;
  const hashtagString = hashtags ? hashtags.map(tag => `#${tag}`).join(' ') : '';
  const fullText = `${title}\n\n${description}\n\n${hashtagString}`;
  
  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(fullText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${fullText}\n\n${url}`)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
  };
}

// Open social media share window
export function openSocialShare(platform: string, shareUrl: string) {
  const width = 600;
  const height = 400;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  
  window.open(
    shareUrl,
    `share-${platform}`,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
}